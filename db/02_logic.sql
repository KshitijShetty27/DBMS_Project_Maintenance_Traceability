-- FUNCTION
CREATE FUNCTION fn_open_failures(p_machine INT) RETURNS INT LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INT FROM failure f JOIN component c USING (component_id)
  WHERE c.machine_id = p_machine AND f.status <> 'RESOLVED';
$$;

-- TRIGGER 1: keep machine.status in sync with failures
CREATE FUNCTION trg_failure_machine_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE m INT;
BEGIN
  SELECT machine_id INTO m FROM component WHERE component_id = NEW.component_id;
  IF NEW.status = 'OPEN' THEN
    UPDATE machine SET status = 'FAULTY' WHERE machine_id = m;
  ELSIF NEW.status = 'IN_PROGRESS' THEN
    UPDATE machine SET status = 'UNDER_MAINTENANCE' WHERE machine_id = m;
  ELSIF NEW.status = 'RESOLVED' AND fn_open_failures(m) = 0 THEN
    UPDATE machine SET status = 'RUNNING' WHERE machine_id = m;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_failure_status AFTER INSERT OR UPDATE OF status ON failure
  FOR EACH ROW EXECUTE FUNCTION trg_failure_machine_status();

-- TRIGGER 2: assigning maintenance moves an OPEN failure to IN_PROGRESS
CREATE FUNCTION trg_maint_started() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE failure SET status = 'IN_PROGRESS' WHERE failure_id = NEW.failure_id AND status = 'OPEN';
  RETURN NEW;
END $$;
CREATE TRIGGER trg_maintenance_insert AFTER INSERT ON maintenance
  FOR EACH ROW EXECUTE FUNCTION trg_maint_started();

-- PROCEDURE 1: assign technician (least-loaded if none given)
CREATE PROCEDURE sp_assign_technician(p_failure INT, p_tech INT, INOUT p_maint INT DEFAULT NULL)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_tech IS NULL THEN
    SELECT t.tech_id INTO p_tech FROM technician t
    LEFT JOIN maintenance m ON m.tech_id = t.tech_id AND m.completed_at IS NULL
    GROUP BY t.tech_id ORDER BY COUNT(m.maintenance_id), t.tech_id LIMIT 1;
  END IF;
  IF p_tech IS NULL THEN RAISE EXCEPTION 'No technician available'; END IF;
  INSERT INTO maintenance (failure_id, tech_id) VALUES (p_failure, p_tech)
  RETURNING maintenance_id INTO p_maint;
END $$;

-- PROCEDURE 2: close ticket (atomic: maintenance + failure)
CREATE PROCEDURE sp_close_ticket(p_maint INT, p_action TEXT, p_cost NUMERIC)
LANGUAGE plpgsql AS $$
DECLARE f INT;
BEGIN
  UPDATE maintenance SET action_taken = p_action, cost = p_cost, completed_at = now()
  WHERE maintenance_id = p_maint AND completed_at IS NULL RETURNING failure_id INTO f;
  IF f IS NULL THEN RAISE EXCEPTION 'Ticket % not found or already closed', p_maint; END IF;
  UPDATE failure SET status = 'RESOLVED', resolved_at = now() WHERE failure_id = f;
END $$;

-- VIEWS
CREATE VIEW v_open_failures_per_machine AS
  SELECT m.machine_id, m.name AS machine, m.status, fn_open_failures(m.machine_id) AS open_failures
  FROM machine m;
CREATE VIEW v_technician_workload AS
  SELECT t.tech_id, t.name,
         COUNT(*) FILTER (WHERE mt.completed_at IS NULL AND mt.maintenance_id IS NOT NULL) AS active_tickets,
         COUNT(*) FILTER (WHERE mt.completed_at IS NOT NULL) AS completed_tickets
  FROM technician t LEFT JOIN maintenance mt ON mt.tech_id = t.tech_id GROUP BY t.tech_id, t.name;

-- DATABASE-LEVEL ROLE-BASED ACCESS CONTROL
CREATE ROLE role_admin NOLOGIN;
CREATE ROLE role_technician NOLOGIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO role_admin;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO role_admin, role_technician;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO role_technician;
GRANT INSERT, UPDATE ON failure, maintenance TO role_technician;   -- no DELETE, no master-data changes
REVOKE ALL ON app_user FROM role_technician;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO role_admin, role_technician;
CREATE ROLE app_admin LOGIN PASSWORD 'admin_pw' IN ROLE role_admin;
CREATE ROLE app_tech  LOGIN PASSWORD 'tech_pw'  IN ROLE role_technician;
