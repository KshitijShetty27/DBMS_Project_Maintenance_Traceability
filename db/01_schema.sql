-- Industrial Maintenance Knowledge & Failure Traceability System (PostgreSQL)
CREATE TABLE technician (
  tech_id        SERIAL PRIMARY KEY,
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(100) NOT NULL UNIQUE,
  specialization VARCHAR(60)
);
CREATE TABLE app_user (
  user_id       SERIAL PRIMARY KEY,
  username      VARCHAR(40) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          VARCHAR(12) NOT NULL CHECK (role IN ('ADMIN','TECHNICIAN')),
  tech_id       INT UNIQUE REFERENCES technician(tech_id) ON DELETE SET NULL
);
CREATE TABLE machine (
  machine_id   SERIAL PRIMARY KEY,
  name         VARCHAR(80) NOT NULL,
  location     VARCHAR(80),
  install_date DATE DEFAULT CURRENT_DATE,
  status       VARCHAR(20) NOT NULL DEFAULT 'RUNNING'
               CHECK (status IN ('RUNNING','FAULTY','UNDER_MAINTENANCE'))
);
CREATE TABLE component (
  component_id        SERIAL PRIMARY KEY,
  machine_id          INT NOT NULL REFERENCES machine(machine_id) ON DELETE CASCADE,
  parent_component_id INT REFERENCES component(component_id) ON DELETE CASCADE, -- sub-assembly hierarchy
  name                VARCHAR(80) NOT NULL,
  UNIQUE (machine_id, name)
);
CREATE TABLE sensor (
  sensor_id    SERIAL PRIMARY KEY,
  component_id INT NOT NULL REFERENCES component(component_id) ON DELETE CASCADE,
  sensor_type  VARCHAR(20) NOT NULL CHECK (sensor_type IN ('VIBRATION','TEMPERATURE','PRESSURE')),
  unit         VARCHAR(10) NOT NULL
);
CREATE TABLE failure (
  failure_id          SERIAL PRIMARY KEY,
  component_id        INT  NOT NULL REFERENCES component(component_id),
  reported_by         INT  REFERENCES app_user(user_id) ON DELETE SET NULL,
  symptom_description TEXT NOT NULL CHECK (length(symptom_description) >= 5),
  severity            VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status              VARCHAR(12) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED')),
  reported_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ,
  CHECK (resolved_at IS NULL OR resolved_at >= reported_at)
);
CREATE TABLE maintenance (
  maintenance_id SERIAL PRIMARY KEY,
  failure_id     INT NOT NULL REFERENCES failure(failure_id) ON DELETE CASCADE,
  tech_id        INT NOT NULL REFERENCES technician(tech_id),
  action_taken   TEXT NOT NULL DEFAULT 'Pending diagnosis',
  cost           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX idx_failure_status    ON failure(status);
CREATE INDEX idx_failure_component ON failure(component_id);
CREATE INDEX idx_maint_tech        ON maintenance(tech_id);
