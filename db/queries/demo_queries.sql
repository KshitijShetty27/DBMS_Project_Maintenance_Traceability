-- DML
INSERT INTO failure (component_id,symptom_description,severity) VALUES (6,'Pressure valve chattering and unstable pressure','MEDIUM');
UPDATE failure SET severity='HIGH' WHERE symptom_description ILIKE '%valve%' AND status='OPEN';
DELETE FROM sensor WHERE sensor_id = 5;
-- JOIN: failures with machine, component and fix
SELECT m.name machine, c.name component, f.symptom_description, mt.action_taken
FROM failure f JOIN component c USING(component_id) JOIN machine m USING(machine_id)
LEFT JOIN maintenance mt USING(failure_id) ORDER BY f.reported_at DESC;
-- NESTED: machines with at least one HIGH/CRITICAL failure
SELECT name FROM machine WHERE machine_id IN (
  SELECT c.machine_id FROM component c JOIN failure f USING(component_id) WHERE f.severity IN ('HIGH','CRITICAL'));
-- CORRELATED: components with more failures than the average component of their machine
SELECT c.name FROM component c WHERE (SELECT COUNT(*) FROM failure f WHERE f.component_id=c.component_id) >
  (SELECT AVG(cnt) FROM (SELECT COUNT(f2.failure_id) cnt FROM component c2 LEFT JOIN failure f2 USING(component_id)
                         WHERE c2.machine_id=c.machine_id GROUP BY c2.component_id) x);
-- RECURSIVE CTE: component hierarchy of machine 1
WITH RECURSIVE tree AS (
  SELECT component_id, name, parent_component_id, 0 AS depth FROM component WHERE machine_id=1 AND parent_component_id IS NULL
  UNION ALL
  SELECT c.component_id, c.name, c.parent_component_id, t.depth+1 FROM component c JOIN tree t ON c.parent_component_id=t.component_id)
SELECT repeat('  ',depth)||name AS hierarchy FROM tree;
-- CTE + WINDOW: rank components by repair cost within each machine
WITH cost AS (SELECT c.machine_id, c.name, SUM(mt.cost) total FROM maintenance mt
  JOIN failure f USING(failure_id) JOIN component c USING(component_id) GROUP BY c.machine_id, c.name)
SELECT machine_id, name, total, RANK() OVER (PARTITION BY machine_id ORDER BY total DESC) rnk FROM cost;
-- SET OPERATION: machines with no open failures
SELECT machine_id FROM machine EXCEPT SELECT c.machine_id FROM failure f JOIN component c USING(component_id) WHERE f.status<>'RESOLVED';
-- VIEWS / PROCEDURE
SELECT * FROM v_open_failures_per_machine; SELECT * FROM v_technician_workload;
CALL sp_assign_technician(5, NULL, NULL::int);
