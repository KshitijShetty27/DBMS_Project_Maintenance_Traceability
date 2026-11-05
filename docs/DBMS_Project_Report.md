# Department of Computer Science and Engineering (AI & ML)
## B. Tech. CSE – 5th Semester | Academic Year: Aug – Dec 2025
### UE23CS351A: DATABASE MANAGEMENT SYSTEMS (DBMS)
### EXPERIENTIAL LEARNING MINI-PROJECT REPORT

---

# INDUSTRIAL MAINTENANCE KNOWLEDGE & FAILURE TRACEABILITY SYSTEM

**Submitted by:**

| SRN | Name | Semester & Section |
| :--- | :--- | :--- |
| **PES1UG24AM143** | **KSHITIJ SATISH SHETTY** | 5th Semester - Section C |
| **PES1UG24AM155** | **MALLIKARJUNA RAO RV** | 5th Semester - Section C |

**Under the Guidance of:**
Class of Prof. [NAME] / [Lab Faculty]  
Department of Computer Science and Engineering  
PES University, Bengaluru – 560085  

---

## ABSTRACT
*Style: Times New Roman | Font: 12 | Justified*

Modern manufacturing facilities and heavy industrial environments face severe operational losses due to unexpected equipment breakdowns and protracted machine downtime. While plant technicians routinely encounter recurring mechanical, electrical, and hydraulic anomalies, diagnostic expertise remains fragmented across disparate paper logs, tribal operator knowledge, and unstructured maintenance tickets. Consequently, when similar equipment failures recur, diagnostic procedures are repeated from scratch, inflating Mean Time to Repair (MTTR) and risking catastrophic secondary asset damage.

To address this critical bottleneck, this project presents the **Industrial Maintenance Knowledge & Failure Traceability System**—a multi-paradigm database system that bridges relational operational control, flexible NoSQL time-series telemetry, and semantic vector embeddings. The core relational foundation is implemented in PostgreSQL 16 normalized to Third Normal Form (3NF), enforcing structural integrity through foreign key cascades, strict check constraints, automated triggers, stored procedures, and database-level Role-Based Access Control (RBAC). Irregular, polymorphic telemetry streams from vibration, temperature, and pressure sensors are ingested using MongoDB 7, enabling schema-agnostic IoT logging and real-time aggregation. To solve the challenge of semantic lexical variance in natural language failure descriptions, the system integrates ChromaDB, an open-source vector database that computes dense embeddings of failure symptoms combined with historical verified remedies.

A high-throughput FastAPI asynchronous backend coordinates multi-database transactions, token-based JSON Web Token (JWT) authentication, and automated technician dispatching procedures. The system interfaces with an intuitive Next.js 14 reactive frontend featuring live debounced semantic search hints that present technicians with proven repair actions in real time as they type failure descriptions. The complete platform is containerized using Docker Compose, establishing a resilient, scalable, and audit-compliant maintenance traceability platform that demonstrably accelerates root-cause diagnosis and equipment recovery.

**Keywords:** Industrial Maintenance, Relational Database, PostgreSQL, MongoDB, ChromaDB, Vector Embeddings, Semantic Search, Role-Based Access Control, Next.js, FastAPI.

---

## TABLE OF CONTENTS

| Sl. No. | Topic | Page No. |
| :---: | :--- | :---: |
| **1.** | [Introduction & Problem Statement](#1-introduction--problem-statement) | 3 |
| **2.** | [User Requirements Specification & Tech Stack Justification](#2-user-requirements-specification--tech-stack-justification) | 4 |
| **3.** | [E-R Model (Entities, Attributes, Cardinalities & ER Diagram)](#3-e-r-model-entity-relationship-model) | 6 |
| **4.** | [Relational Model (Schema Mapping, Relations & 3NF Normalization)](#4-relational-model) | 8 |
| **5.** | [SQL DDL Statements (Schema Definition & Constraints)](#5-sql-ddl-statements) | 11 |
| **6.** | [SQL DML Statements & Advanced Analytical Queries](#6-sql-dml-statements--advanced-analytical-queries) | 14 |
| **7.** | [NoSQL & Vector Database Implementation (MongoDB & ChromaDB)](#7-nosql--vector-database-implementation) | 18 |
| **8.** | [Results & Advanced Database Concepts (Triggers, Procedures, Views, Rollback)](#8-results--advanced-database-concepts) | 22 |
| **9.** | [Next.js – Project Tree Structure & Architectural Breakdown](#9-nextjs--project-tree-structure) | 26 |
| **10.** | [Application Walkthrough, Demonstration & RBAC Security](#10-application-walkthrough-demo--rbac-security) | 28 |
| **11.** | [Evaluation Rubrics – Completion Status & Individual Contributions](#11-evaluation-rubrics--completion-status) | 34 |

---

## 1. INTRODUCTION & PROBLEM STATEMENT

### 1.1 Background & Context
In modern automated manufacturing, discrete assembly lines, and heavy process industries, equipment availability is the primary determinant of overall plant throughput and profitability. Industrial machinery such as CNC lathes, high-pressure hydraulic stamping presses, and continuous material conveyors operate under extreme mechanical stress, continuous duty cycles, and variable thermal environments. Inevitably, components degrade, bearings suffer fatigue spalling, hydraulic valves chatter, suction filters clog, and electric motors experience thermal overloads.

Historically, computerized maintenance management systems (CMMS) have functioned as passive digital filing cabinets. They record when an asset failed, which technician was assigned, and how many hours were logged. However, they critically fail to capture and reuse the engineering knowledge embedded within successful troubleshooting events. Diagnostic intelligence remains locked in unstructured text fields, inaccessible to technicians under the pressure of an active production stoppage.

### 1.2 Problem Statement
> **Problem Statement:**  
> *"Industrial maintenance teams suffer from substantial diagnostic latency and repeated troubleshooting cycles because existing maintenance logging systems lack semantic retrieval capabilities, fail to accommodate irregular multi-modal sensor telemetry, and lack automated, integrity-enforced dispatch workflows. Technicians describe identical physical faults using diverse vocabularies, rendering conventional keyword searches ineffective. Furthermore, rigid relational schemas cannot natively capture polymorphic sensor logs, while maintenance operations demand strict ACID transactions and multi-level role-based security to prevent data corruption and unauthorized tampering."*

**Short Description:**  
When an operator or technician notices an anomaly—such as a *"loud whining noise and pressure dropping below 120 bar"*—conventional relational SQL keyword filters (e.g., `LIKE '%whining%'`) fail if the historical ticket was logged as *"hydraulic pump cavitation with suction line air ingress"*. The lack of semantic search forces technicians to reinvent diagnostic paths, ordering redundant parts and increasing downtime. There is an urgent need for an unified architecture that couples relational integrity for master asset management with vector search for diagnostic memory and document-oriented storage for sensor telemetry.

### 1.3 Objectives & Scope
The primary objectives of this project are:
1. **Relational Core in 3NF:** Design and implement a robust relational database schema in PostgreSQL 16 that models machines, hierarchical sub-assemblies, sensors, technicians, user credentials, failures, and maintenance actions with comprehensive primary, foreign, unique, and check constraints.
2. **Knowledge Traceability via Vector Embeddings:** Ingest natural language symptom descriptions and historical resolution records into ChromaDB vector store to provide sub-second semantic similarity search, displaying past solutions and confidence match percentages.
3. **Polymorphic Telemetry Storage:** Integrate MongoDB 7 to store irregular, high-frequency telemetry readings from heterogeneous sensor types (vibration tri-axial RMS, thermal ambient differentials, hydraulic pressures) without schema friction.
4. **Automated Procedural Workflows:** Implement stored procedures and event-driven triggers in PL/pgSQL to dynamically balance technician workloads, automate state transitions (`OPEN` &rarr; `IN_PROGRESS` &rarr; `RESOLVED`), and synchronize overall machine status.
5. **Multi-Tier Security & RBAC:** Implement full authentication (PBKDF2-HMAC-SHA256 password hashing, JWT bearer tokens) and enforce two-tier Role-Based Access Control both at the API layer and natively at the PostgreSQL database engine layer (`role_admin` vs `role_technician`).
6. **Reactive User Interface:** Construct an end-to-end responsive web dashboard in Next.js 14 providing live typing semantic hints, interactive telemetry aggregation views, failure reporting, and administrative control panels.

---

## 2. USER REQUIREMENTS SPECIFICATION & TECH STACK JUSTIFICATION

### 2.1 User Requirements Specification

#### 2.1.1 Functional Requirements (FR)
- **FR-01 (Master Asset & Component Registry):** The system shall maintain an accurate inventory of industrial machines and their hierarchical component tree (sub-assemblies), ensuring strict referential integrity upon modification or deletion.
- **FR-02 (Failure Incident Logging):** Authenticated users (Operators, Technicians, Administrators) shall report machine failures specifying component, symptom description in natural language, and severity rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **FR-03 (Real-Time Semantic Troubleshooting Hints):** As technicians type failure symptoms, the interface shall automatically execute debounced semantic queries against the vector store, presenting the top matching historical incidents and proven remedies.
- **FR-04 (Automated Dispatching):** The system shall support automated technician assignment using an intelligent load-balancing stored procedure that selects the available technician with the fewest active tickets.
- **FR-05 (Atomic Ticket Closure):** Closing a maintenance ticket must atomically record the corrective action taken, actual repair cost, completion timestamp, and update the failure record to `RESOLVED` within a single database transaction.
- **FR-06 (Sensor Telemetry Ingestion & Aggregation):** The system shall ingest heterogeneous IoT sensor readings and compute real-time statistical summaries (average, maximum, reading counts) grouped by component and sensor type.
- **FR-07 (Role-Based Access Control):** The system must enforce strict operational boundaries: Technicians may log failures, view historical data, and close assigned tickets, but are strictly forbidden from modifying master machine data or deleting records.

#### 2.1.2 Non-Functional Requirements (NFR)
- **NFR-01 (Data Integrity & Consistency):** All relational tables must adhere to Third Normal Form (3NF), with zero orphaned records, supported by foreign key cascading constraints and PostgreSQL transactional ACID guarantees.
- **NFR-02 (Performance & Latency):** Vector similarity searches must return top-k matches within 250 milliseconds; relational query executions must execute in under 50 milliseconds using optimized B-Tree indexing.
- **NFR-03 (Security & Auditability):** Passwords must never be stored in plaintext. They must be salted and hashed using PBKDF2 with SHA-256 (100,000 iterations). API calls must validate cryptographically signed JWT tokens.
- **NFR-04 (Fault Tolerance & Graceful Rollback):** Any multi-table transaction that violates business rules or integrity constraints must roll back completely without partial state modification.

### 2.2 Technology Stack Architecture & Justification

| Layer | Technology | Primary Role & Responsibility |
| :--- | :--- | :--- |
| **Relational DB** | **PostgreSQL 16** | 3NF Master data (machines, components, users, tickets), ACID transactions, triggers, procedures, views, DB-level RBAC |
| **NoSQL DB** | **MongoDB 7** | Polymorphic, irregular sensor telemetry logs, high-throughput time-series ingestion, aggregation pipeline |
| **Vector DB** | **ChromaDB (Persistent)** | Dense vector embeddings of failure symptoms & verified fixes, cosine similarity retrieval, semantic search |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous REST endpoints, connection pooling, JWT security, multi-database transaction coordination |
| **Frontend UI** | **Next.js 14 / React 18** | Client-side dashboard, debounced live-search hints, sensor visualization, role-gated UI controls |
| **Orchestration** | **Docker Compose** | Multi-container provisioning for reproducible, isolated database environments |

#### Justification for Relational Database (PostgreSQL 16)
A relational database is irreplaceable for industrial maintenance management due to the absolute requirement for ACID (Atomicity, Consistency, Isolation, Durability) transactions. Machine registries, sub-assembly component hierarchies, technician assignments, and financial repair costs require strict foreign key constraints, unique constraints, and schema enforcement. Furthermore, PostgreSQL provides advanced programmable procedural capabilities (PL/pgSQL stored procedures, triggers, and recursive common table expressions) and robust database-level security roles (`role_admin`, `role_technician`) that enforce permission boundaries directly at the storage engine.

#### Justification for NoSQL Database (MongoDB 7)
Industrial IoT sensors exhibit extreme schema variability. A tri-axial vibration sensor reports acceleration along X, Y, and Z axes and Root Mean Square (RMS) velocity; an infrared temperature sensor logs surface and ambient temperatures; a hydraulic pressure transducer logs transient bar spikes. Forcing these polymorphic, rapidly arriving data points into a rigid relational table results in sparsely populated columns filled with NULL values or costly schema alterations whenever a new sensor vendor is introduced. MongoDB's document-oriented JSON/BSON paradigm allows dynamic nested structures (`data.axis`, `data.rms`, `data.ambient`), high-throughput append-only writes, and an expressive aggregation framework for on-the-fly statistical analysis.

#### Justification for Vector Database (ChromaDB)
Standard SQL pattern matching (e.g., `LIKE '%motor overheat%'`) fails completely when technicians use synonymous domain phrasing (e.g., *"thermal overload tripping stator coil"*). ChromaDB provides persistent vector indexing that converts raw diagnostic descriptions into 384-dimensional dense semantic embeddings. By performing cosine distance nearest-neighbor queries, ChromaDB retrieves past failure cases based on conceptual meaning rather than literal keyword overlap, bridging the linguistic gap between different technicians and shifts.

---

## 3. E-R MODEL (ENTITY-RELATIONSHIP MODEL)

### 3.1 List of Entities
The conceptual model comprises six core entities categorized into Strong and Weak entities based on existential and identifying dependencies:

1. **MACHINE (Strong Entity):** Represents a primary industrial asset on the plant floor. It possesses independent existence with its own primary key `machine_id`.
2. **TECHNICIAN (Strong Entity):** Represents certified maintenance personnel employed at the facility. Identified by primary key `tech_id`.
3. **APP_USER (Strong Entity):** Represents authentication identities granting access to the system. Identified by `user_id`. Each user links to an optional technician record in a 1:1 relationship.
4. **COMPONENT [Weak / Dependent Entity]:** Represents physical sub-assemblies and parts housed within a specific machine. It is existentially and identifyingly dependent on `MACHINE`. In the conceptual model, a component is identified in the plant context by the combination of its parent machine and component name `(machine_id, name)`. It also exhibits a recursive hierarchy (`parent_component_id`).
5. **SENSOR [Weak / Dependent Entity]:** Represents physical telemetry transducers installed on a component. A sensor cannot exist without its host component, forming an existential dependency.
6. **FAILURE [Subordinate Event Entity]:** Represents an operational failure event reported on a specific component. Identified by `failure_id` and existentially dependent on the host `component`.

### 3.2 List of Non-Simple Attributes
1. **symptom_description (Text / Vectorized Composite Attribute in FAILURE):** Unlike simple atomic strings, this attribute contains extensive, multi-sentence natural language descriptions capturing mechanical symptoms, abnormal sounds, pressure drops, and operational context. It undergoes downstream vectorization to generate dense mathematical embeddings for semantic querying.
2. **data (Polymorphic Composite Document Attribute in SENSOR_READINGS):** In the NoSQL telemetry layer, the `data` attribute is a non-simple nested document whose internal schema varies dynamically per sensor type (`data.value`, `data.axis`, `data.rms`, `data.ambient`).
3. **location (Composite Attribute in MACHINE):** Encapsulates building, bay, and machine cell coordinates (e.g., *"Shop A - Bay 3"*).

### 3.3 Entity-Relationship Diagram Snapshot
![Figure 3.1: Entity-Relationship Diagram](screenshots/02_PostgreSQL/ER_Diagram.png)
*Figure 3.1: Entity-Relationship (ER) Diagram illustrating entities, recursive component hierarchies, foreign keys, and cardinalities.*

### 3.4 Relationship Analysis & Cardinalities
- **MACHINE &ndash; COMPONENT (1 : N):** One machine consists of one or more components. A component belongs strictly to exactly one machine. Mandatory on the component side.
- **COMPONENT &ndash; COMPONENT (1 : N Recursive):** Models hierarchical sub-assembly trees (e.g., Spindle Assembly &rarr; Spindle Bearing). A parent component can have multiple child components; a child component has at most one parent.
- **COMPONENT &ndash; SENSOR (1 : N):** A component may host zero, one, or multiple telemetry sensors. Each sensor monitors exactly one component.
- **COMPONENT &ndash; FAILURE (1 : N):** A component may experience zero or many failure incidents over its operational lifespan. Each failure belongs to exactly one component.
- **APP_USER &ndash; FAILURE (1 : N):** A system user may report multiple failure incidents. A failure record captures the reporting user ID for traceability.
- **FAILURE &ndash; MAINTENANCE (1 : N):** A failure incident is addressed through maintenance actions. In our workflow, a failure links to maintenance tickets tracking diagnosis and corrective repair.
- **TECHNICIAN &ndash; MAINTENANCE (1 : N):** A technician performs multiple maintenance jobs. Each maintenance ticket is assigned to a designated technician.
- **TECHNICIAN &ndash; APP_USER (1 : 1 Optional):** A technician may have an associated login account (`app_user`) to authenticate into the system.

---

## 4. RELATIONAL MODEL

### 4.1 Relations That Are Not Entities in ER Model
In pure Entity-Relationship modeling, relationships with descriptive attributes often resolve M:N associations between participating entities:

> **Relation `maintenance`:**  
> In the conceptual ER model, the maintenance resolution process represents an associative relationship `RESOLVED_BY` connecting `FAILURE` and `TECHNICIAN`. This relationship possesses distinct operational attributes: `action_taken`, `cost`, `started_at`, and `completed_at`. When mapped to the Relational Model, this M:N relationship cannot be represented as a simple foreign key inside either entity without violating 1NF and introducing multi-valued dependencies. Therefore, it is converted into a distinct physical relation named `maintenance` with a surrogate primary key `maintenance_id` and foreign keys referencing `failure(failure_id)` and `technician(tech_id)`.

### 4.2 Relational Schema Definitions
The formal relational schema is defined as follows (Primary Keys are **bold/underlined**, Foreign Keys indicated):

1. **`technician`** (**`tech_id`**, `name`, `email`, `specialization`)
2. **`app_user`** (**`user_id`**, `username`, `password_hash`, `role`, `tech_id` &rarr; `technician.tech_id`)
3. **`machine`** (**`machine_id`**, `name`, `location`, `install_date`, `status`)
4. **`component`** (**`component_id`**, `machine_id` &rarr; `machine.machine_id`, `parent_component_id` &rarr; `component.component_id`, `name`)
5. **`sensor`** (**`sensor_id`**, `component_id` &rarr; `component.component_id`, `sensor_type`, `unit`)
6. **`failure`** (**`failure_id`**, `component_id` &rarr; `component.component_id`, `reported_by` &rarr; `app_user.user_id`, `symptom_description`, `severity`, `status`, `reported_at`, `resolved_at`)
7. **`maintenance`** (**`maintenance_id`**, `failure_id` &rarr; `failure.failure_id`, `tech_id` &rarr; `technician.tech_id`, `action_taken`, `cost`, `started_at`, `completed_at`)

### 4.3 Relational Schema Diagram
![Figure 4.1: PostgreSQL Relational Schema Diagram](screenshots/02_PostgreSQL/Schema_Diagram.png)
*Figure 4.1: PostgreSQL Relational Schema Diagram generated from database catalog (Clean light background).*

### 4.4 Functional Dependencies & Normalization Proof (3NF / BCNF)
- **First Normal Form (1NF):** Every attribute in all relations contains only atomic, indivisible values. There are no repeating groups or multi-valued arrays in the relational tables (unstructured telemetry arrays are properly isolated into the NoSQL layer).
- **Second Normal Form (2NF):** Every non-prime attribute is fully functionally dependent on the entire candidate key. Since all tables utilize single-attribute primary keys (`machine_id`, `component_id`, `tech_id`, `failure_id`, etc.), partial functional dependencies are mathematically impossible.
- **Third Normal Form (3NF):** No non-prime attribute is transitively dependent on a candidate key ($X ightarrow Y$ where $Y$ is non-prime and $X$ is not a superkey). For example, in `component`, `machine_id` references `machine`, but machine attributes (`name`, `location`) are not duplicated within `component`. Similarly, in `maintenance`, technician specialization is not duplicated; it is accessed purely via `tech_id` join.
- **Boyce-Codd Normal Form (BCNF):** For every non-trivial functional dependency $X ightarrow Y$, $X$ is a superkey. In `component`, candidate keys are `component_id` and the unique compound key `(machine_id, name)`, both of which are superkeys.

---

## 5. SQL DDL STATEMENTS

### 5.1 Complete DDL Implementation
The following Data Definition Language (DDL) statements implement the relational schema in PostgreSQL 16, embedding primary keys, foreign key cascading actions, check constraints, default values, and performance indexes:

```sql
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
```

### 5.2 DDL Execution & Catalog Verification Screenshots
![Figure 5.1: DDL Execution for Technician and App_User Tables](screenshots/02_PostgreSQL/S5_ddl_technician_appuser.png)
*Figure 5.1: DDL Execution for Technician and App_User Tables.*

![Figure 5.2: DDL Execution for Component and Sensor Tables](screenshots/02_PostgreSQL/S5_ddl_sensor.png)
*Figure 5.2: DDL Execution for Component and Sensor Tables.*

![Figure 5.3: Machine Table Structure & Constraints](screenshots/02_PostgreSQL/03_Machine_Table_Structure.png)
*Figure 5.3: Machine Table Structure & Constraints in PostgreSQL.*

![Figure 5.4: Component Table Structure](screenshots/02_PostgreSQL/04_Component_Table_Structure.png)
*Figure 5.4: Component Table Structure with Recursive Foreign Key.*

![Figure 5.5: Failure & Maintenance Table Structure](screenshots/02_PostgreSQL/05_Failure_Maintenance_Structure.png)
*Figure 5.5: Failure & Maintenance Table Structure and Indexes.*

---

## 6. SQL DML STATEMENTS & ADVANCED ANALYTICAL QUERIES

### 6.1 Standard Data Manipulation Language (DML)

#### 6.1.1 INSERT Statement
```sql
INSERT INTO failure (component_id, symptom_description, severity)
VALUES (6, 'Pressure valve chattering and unstable pressure', 'MEDIUM');
```
![Figure 6.1: Execution of INSERT Statement on Failure Table](screenshots/02_PostgreSQL/S6_dml_insert.png)
*Figure 6.1: Execution of INSERT Statement on Failure Table.*

#### 6.1.2 UPDATE Statement
```sql
UPDATE failure 
SET severity = 'HIGH' 
WHERE symptom_description ILIKE '%valve%' AND status = 'OPEN';
```
![Figure 6.2: Execution of UPDATE Statement Escalating Failure Severity](screenshots/02_PostgreSQL/S6_dml_update.png)
*Figure 6.2: Execution of UPDATE Statement Escalating Failure Severity.*

#### 6.1.3 DELETE Statement
```sql
DELETE FROM sensor WHERE sensor_id = 5;
```
![Figure 6.3: Execution of DELETE Statement on Sensor Table](screenshots/02_PostgreSQL/S6_dml_delete.png)
*Figure 6.3: Execution of DELETE Statement on Sensor Table.*

---

### 6.2 Complex & Advanced SQL Queries

#### 6.2.1 Multi-Table JOIN Query
Retrieves all reported failures alongside their parent machine, component name, and the maintenance action taken (if any):
```sql
SELECT m.name AS machine, c.name AS component, f.symptom_description, mt.action_taken
FROM failure f 
JOIN component c USING(component_id) 
JOIN machine m USING(machine_id)
LEFT JOIN maintenance mt USING(failure_id) 
ORDER BY f.reported_at DESC;
```
![Figure 6.4: Multi-Table JOIN Query Output](screenshots/02_PostgreSQL/S6_query_join.png)
*Figure 6.4: Multi-Table JOIN Query Output.*

#### 6.2.2 Nested SQL Query (Subquery with IN)
Identifies all machines that currently host at least one HIGH or CRITICAL severity failure:
```sql
SELECT name FROM machine WHERE machine_id IN (
  SELECT c.machine_id FROM component c 
  JOIN failure f USING(component_id) 
  WHERE f.severity IN ('HIGH', 'CRITICAL')
);
```
![Figure 6.5: Nested Subquery Identifying High-Risk Machines](screenshots/02_PostgreSQL/S6_query_nested.png)
*Figure 6.5: Nested Subquery Identifying High-Risk Machines.*

#### 6.2.3 Correlated Subquery
Finds anomalous components that have experienced more failure incidents than the average component of their specific machine:
```sql
SELECT c.name FROM component c 
WHERE (SELECT COUNT(*) FROM failure f WHERE f.component_id = c.component_id) >
  (SELECT AVG(cnt) FROM (
     SELECT COUNT(f2.failure_id) AS cnt 
     FROM component c2 
     LEFT JOIN failure f2 USING(component_id)
     WHERE c2.machine_id = c.machine_id 
     GROUP BY c2.component_id
   ) x);
```
![Figure 6.6: Correlated Subquery Output](screenshots/02_PostgreSQL/S6_query_correlated.png)
*Figure 6.6: Correlated Subquery Output.*

#### 6.2.4 Recursive Common Table Expression (CTE) Query
Traverses the self-referencing sub-assembly component hierarchy of Machine 1 ('CNC Lathe L1'), displaying tree depth and indented hierarchy:
```sql
WITH RECURSIVE tree AS (
  SELECT component_id, name, parent_component_id, 0 AS depth 
  FROM component 
  WHERE machine_id = 1 AND parent_component_id IS NULL
  UNION ALL
  SELECT c.component_id, c.name, c.parent_component_id, t.depth + 1 
  FROM component c 
  JOIN tree t ON c.parent_component_id = t.component_id
)
SELECT repeat('  ', depth) || name AS hierarchy FROM tree;
```
![Figure 6.7: Recursive CTE Traversing Hierarchical Sub-Assembly Tree](screenshots/02_PostgreSQL/S6_query_recursive_cte.png)
*Figure 6.7: Recursive CTE Traversing Hierarchical Sub-Assembly Tree.*

#### 6.2.5 CTE Combined with Window Function (RANK OVER PARTITION)
Calculates total repair expenditures per component and ranks them within their respective parent machines:
```sql
WITH cost AS (
  SELECT c.machine_id, c.name, SUM(mt.cost) AS total 
  FROM maintenance mt
  JOIN failure f USING(failure_id) 
  JOIN component c USING(component_id) 
  GROUP BY c.machine_id, c.name
)
SELECT machine_id, name, total, 
       RANK() OVER (PARTITION BY machine_id ORDER BY total DESC) AS rnk 
FROM cost;
```
![Figure 6.8: Window Function Ranking Repair Costs per Machine](screenshots/02_PostgreSQL/S6_query_cte_window.png)
*Figure 6.8: Window Function Ranking Repair Costs per Machine.*

#### 6.2.6 Set Operation Query (EXCEPT)
Identifies machines currently operating with zero open or unresolved failures:
```sql
SELECT machine_id FROM machine 
EXCEPT 
SELECT c.machine_id FROM failure f 
JOIN component c USING(component_id) 
WHERE f.status <> 'RESOLVED';
```

---

## 7. NOSQL & VECTOR DATABASE IMPLEMENTATION

### 7.1 NoSQL Telemetry Database (MongoDB 7)
Industrial sensor streams arrive at high frequencies with varying schemas depending on the transducer modality. MongoDB collection `maintenance_logs.readings` stores telemetry documents where the `data` sub-document flexibly accommodates dynamic fields.

#### 7.1.1 Document Schema Design
```json
// Example MongoDB Telemetry Document (Vibration Sensor)
{
  "_id": ObjectId("6729a1b2c3d4e5f6a7b8c901"),
  "component_id": 2,
  "sensor_type": "VIBRATION",
  "ts": ISODate("2026-11-05T08:30:00Z"),
  "data": {
    "value": 4.82,
    "axis": "Z",
    "rms": 1.45
  }
}
```

#### 7.1.2 MongoDB CRUD Operations
- **Create (Insert):** `readings.insert_one({'component_id': cid, 'sensor_type': typ, 'ts': now, 'data': d})`
- **Read (Query):** `readings.find({'component_id': cid}).sort('ts', -1).limit(30)`
- **Update:** `readings.update_one({'_id': ObjectId(rid)}, {'$set': {'data.value': new_val}})`
- **Delete:** `readings.delete_one({'_id': ObjectId(rid)})` *(Restricted to ADMIN)*

#### 7.1.3 MongoDB Aggregation Pipeline
Aggregates telemetry readings grouped by component and sensor type, computing average and maximum readings:
```python
readings.aggregate([
    {"$group": {
        "_id": {"component_id": "$component_id", "type": "$sensor_type"},
        "avg": {"$avg": "$data.value"},
        "max": {"$max": "$data.value"},
        "count": {"$sum": 1}
    }},
    {"$project": {
        "_id": 0,
        "component_id": "$_id.component_id",
        "type": "$_id.type",
        "avg": {"$round": ["$avg", 2]},
        "max": 1,
        "count": 1
    }},
    {"$sort": {"component_id": 1}}
])
```

![Figure 7.1: MongoDB Reading Query Results](screenshots/03_MongoDB_ChromaDB/S7_mongo_read.png)
*Figure 7.1: MongoDB Reading Query Results.*

![Figure 7.2: MongoDB CRUD Operations Execution](screenshots/03_MongoDB_ChromaDB/S7_mongo_create_update_delete.png)
*Figure 7.2: MongoDB CRUD Operations Execution.*

![Figure 7.3: MongoDB Aggregation Pipeline Output](screenshots/03_MongoDB_ChromaDB/S7_mongo_aggregate.png)
*Figure 7.3: MongoDB Aggregation Pipeline Output.*

![Figure 7.4: Editing MongoDB Telemetry Reading in UI](screenshots/03_MongoDB_ChromaDB/S7_mongo_edit_in_ui.png)
*Figure 7.4: Editing MongoDB Telemetry Reading in UI.*

---

### 7.2 Vector Knowledge Base (ChromaDB)
ChromaDB stores dense vector representations of failure reports. Each record combines the initial symptom description with the verified historical repair fix. When queried, it computes cosine distances across 384-dimensional space to identify semantically related historical anomalies.

#### 7.2.1 ChromaDB Operations (Create, Query, Update, Delete)
```python
# ChromaDB Collection Initialization
vec = chromadb.PersistentClient(path="chroma_store").get_or_create_collection("failure_reports")

# Upsert (Create / Re-embed):
vec.upsert(
    ids=[str(fid)],
    documents=[f"{symptom_description} | Fix: {action_taken}"],
    metadatas=[{"failure_id": fid, "machine": mach, "component": comp, "severity": sev, "status": stat}]
)

# Semantic Query:
results = vec.query(query_texts=["pump whining and pressure drop"], n_results=5)

# Vector Delete (Restricted to Admin):
vec.delete(ids=[str(fid)])
```

![Figure 7.5: ChromaDB Persistent Collection Contents](screenshots/03_MongoDB_ChromaDB/S7_chroma_contents.png)
*Figure 7.5: ChromaDB Persistent Collection Contents.*

![Figure 7.6: Vector Re-Embedding & Upsert Operation](screenshots/03_MongoDB_ChromaDB/S7_vector_update.png)
*Figure 7.6: Vector Re-Embedding & Upsert Operation.*

![Figure 7.7: Vector Record Deletion from Index](screenshots/03_MongoDB_ChromaDB/S7_vector_delete.png)
*Figure 7.7: Vector Record Deletion from Index.*

![Figure 7.8: Backend API Endpoint for Vector Deletion](screenshots/03_MongoDB_ChromaDB/S7_vector_delete_implementation.png)
*Figure 7.8: Backend API Endpoint for Vector Deletion.*

---

## 8. RESULTS & ADVANCED DATABASE CONCEPTS

### 8.1 Advanced Procedural Database Logic

#### 8.1.1 Stored Function: fn_open_failures
Calculates the count of currently unresolved (`OPEN` or `IN_PROGRESS`) failures for any given machine:
```sql
CREATE FUNCTION fn_open_failures(p_machine INT) RETURNS INT 
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INT 
  FROM failure f JOIN component c USING (component_id)
  WHERE c.machine_id = p_machine AND f.status <> 'RESOLVED';
$$;
```

#### 8.1.2 Stored Procedure 1: sp_assign_technician (Least-Loaded Auto-Dispatch)
Automatically assigns an available technician with the lowest active ticket count if no technician is explicitly specified:
```sql
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
```

#### 8.1.3 Stored Procedure 2: sp_close_ticket (Atomic Multi-Table State Update)
Atomically marks the maintenance record as completed and updates the corresponding failure record to `RESOLVED`:
```sql
CREATE PROCEDURE sp_close_ticket(p_maint INT, p_action TEXT, p_cost NUMERIC)
LANGUAGE plpgsql AS $$
DECLARE f INT;
BEGIN
  UPDATE maintenance 
  SET action_taken = p_action, cost = p_cost, completed_at = now()
  WHERE maintenance_id = p_maint AND completed_at IS NULL 
  RETURNING failure_id INTO f;
  
  IF f IS NULL THEN RAISE EXCEPTION 'Ticket % not found or already closed', p_maint; END IF;
  UPDATE failure SET status = 'RESOLVED', resolved_at = now() WHERE failure_id = f;
END $$;
```

#### 8.1.4 Triggers & Trigger Chaining
Two event-driven triggers maintain operational synchronization without application-level overhead:
1. **Trigger 1 (`trg_failure_status`):** Keeps `machine.status` in sync with failure lifecycle (`FAULTY` when OPEN, `UNDER_MAINTENANCE` when IN_PROGRESS, and `RUNNING` when all failures are RESOLVED).
2. **Trigger 2 (`trg_maintenance_insert`):** When a new maintenance ticket is inserted, it automatically updates the failure status from `OPEN` to `IN_PROGRESS`, which in turn triggers Trigger 1, setting the machine to `UNDER_MAINTENANCE` (Demonstrating **Trigger Chaining**!).

```sql
CREATE TRIGGER trg_failure_status 
AFTER INSERT OR UPDATE OF status ON failure
FOR EACH ROW EXECUTE FUNCTION trg_failure_machine_status();

CREATE TRIGGER trg_maintenance_insert 
AFTER INSERT ON maintenance
FOR EACH ROW EXECUTE FUNCTION trg_maint_started();
```

#### 8.1.5 Database Views
Two analytical views provide real-time operational summaries:
- **View 1 (`v_open_failures_per_machine`):** Displays current machine status alongside its active open failure count.
- **View 2 (`v_technician_workload`):** Summarizes active tickets vs completed tickets per technician.

```sql
CREATE VIEW v_open_failures_per_machine AS
  SELECT m.machine_id, m.name AS machine, m.status, fn_open_failures(m.machine_id) AS open_failures
  FROM machine m;

CREATE VIEW v_technician_workload AS
  SELECT t.tech_id, t.name,
         COUNT(*) FILTER (WHERE mt.completed_at IS NULL AND mt.maintenance_id IS NOT NULL) AS active_tickets,
         COUNT(*) FILTER (WHERE mt.completed_at IS NOT NULL) AS completed_tickets
  FROM technician t LEFT JOIN maintenance mt ON mt.tech_id = t.tech_id GROUP BY t.tech_id, t.name;
```

### 8.2 Execution Results & Verification Screenshots
![Figure 8.1: PL/pgSQL Function & Stored Procedure Definitions in psql](screenshots/02_PostgreSQL/8_functions_procedures.png)
*Figure 8.1: PL/pgSQL Function & Stored Procedure Definitions in psql.*

![Figure 8.2: SQL Logic Execution in Backend and psql](screenshots/02_PostgreSQL/S8_code_logic_sq.png)
*Figure 8.2: SQL Logic Execution in Backend and psql.*

![Figure 8.3: Trigger Chaining Execution Log](screenshots/02_PostgreSQL/S8_trigger_chain.png)
*Figure 8.3: Trigger Chaining Execution Log (Maintenance Insert &rarr; Failure &rarr; Machine Status).*

![Figure 8.4: Views and Trigger Creation Log](screenshots/02_PostgreSQL/S8_views_triggers.png)
*Figure 8.4: Views and Trigger Creation Log.*

![Figure 8.5: Execution Output of Analytical Views](screenshots/02_PostgreSQL/S8_views_output.png)
*Figure 8.5: Execution Output of Analytical Views.*

![Figure 8.6: Transaction Rollback Demonstrating ACID Atomicity](screenshots/02_PostgreSQL/S8_transaction_rollback.png)
*Figure 8.6: Transaction Rollback Demonstrating ACID Atomicity on Constraint Violation.*

![Figure 8.7: Public Schema Tables Catalog in PostgreSQL](screenshots/02_PostgreSQL/02_PostgreSQL_Tables.png)
*Figure 8.7: Public Schema Tables Catalog in PostgreSQL.*

![Figure 8.8: Resulting Seed Data in Machine & Component Tables](screenshots/02_PostgreSQL/06_Machine_Component_Data.png)
*Figure 8.8: Resulting Seed Data in Machine & Component Tables.*

![Figure 8.9: Resulting Seed Data in Failure & Maintenance Tables](screenshots/02_PostgreSQL/07_Failure_Maintenance_Data.png)
*Figure 8.9: Resulting Seed Data in Failure & Maintenance Tables.*

---

## 9. NEXT.JS – PROJECT TREE STRUCTURE

### 9.1 Project Directory Architecture
```
maintenance-traceability/
├── docker-compose.yml           # PostgreSQL 16 & MongoDB 7 container setup
├── README.md                    # System architecture & deployment instructions
├── db/                          # Database initialization & SQL scripts
│   ├── 01_schema.sql            # DDL: Tables, constraints, indexes
│   ├── 02_logic.sql             # Functions, procedures, triggers, views, RBAC roles
│   ├── 03_seed.sql              # Initial master seed data
│   └── queries/
│       └── demo_queries.sql     # Complex analytical queries (JOIN, CTE, Window, etc.)
├── backend/                     # FastAPI REST API Backend
│   ├── main.py                  # API endpoints, DB connection pools, JWT auth, vector sync
│   ├── requirements.txt         # Python dependencies (FastAPI, psycopg2, pymongo, chromadb)
│   └── chroma_store/            # Persistent ChromaDB vector storage files
├── frontend/                    # Next.js 14 Web Application
│   ├── package.json             # Next.js, React, and build configurations
│   └── app/
│       ├── layout.js            # Global layout shell and fonts
│       ├── globals.css          # CSS styling, badges, cards, responsive tables
│       └── page.js              # Full-featured reactive dashboard and interface
└── screenshots/                 # Comprehensive documentation screenshots
    ├── 01_Frontend/             # Next.js UI pages and interactions
    ├── 02_PostgreSQL/           # SQL DDL, DML, ERD, Schema, Triggers, Views
    ├── 03_MongoDB_ChromaDB/     # NoSQL readings & Vector similarity search
    ├── 04_Authentication/       # RBAC, login pages, Swagger token tests
    └── 05_Documentation/        # Docker Compose setup & Project tree
```

### 9.2 Project Tree Structure Screenshot
![Figure 9.1: Project Directory Structure in Terminal](screenshots/05_Documentation/S9_project_tree.png)
*Figure 9.1: Project Directory Structure in Terminal.*

---

## 10. APPLICATION WALKTHROUGH, DEMO & RBAC SECURITY

### 10.1 Web Application Demonstration

#### 10.1.1 Authentication & Role-Based Login
Users authenticate via the login portal. Demo credentials support two operational roles: `admin / admin123` (Plant Administrator) and `tech1 / tech123` (Field Technician):

![Figure 10.1: Application Login Portal](screenshots/04_Authentication/10_Login_Page.png)
*Figure 10.1: Application Login Portal.*

![Figure 10.2: Technician Login Execution](screenshots/04_Authentication/01_Technician_Login.png)
*Figure 10.2: Technician Login Execution.*

![Figure 10.3: Administrator Login Execution](screenshots/04_Authentication/S10_admin_login.png)
*Figure 10.3: Administrator Login Execution.*

#### 10.1.2 Technician Dashboard & Status Views
The dashboard provides live operational telemetry, displaying active machine counts, unresolved failure tallies, and embedded SQL views (`v_open_failures_per_machine` and `v_technician_workload`):

![Figure 10.4: Technician Dashboard with Machine Status & Workload Views](screenshots/01_Frontend/2_Technician_Dashboard.png)
*Figure 10.4: Technician Dashboard with Machine Status & Workload Views.*

![Figure 10.5: Updated Dashboard After State Transitions](screenshots/01_Frontend/S10_dashboard_after.png)
*Figure 10.5: Updated Dashboard After State Transitions.*

#### 10.1.3 Failure Reporting with Live Semantic Hints
When reporting a failure, typing a symptom description triggers debounced semantic search against ChromaDB, displaying matching past incidents and proven historical fixes before submitting the ticket:

![Figure 10.6: Failure Logging Interface with Component Selector](screenshots/01_Frontend/S10_tech_log_failure.png)
*Figure 10.6: Failure Logging Interface with Component Selector.*

![Figure 10.7: Live Semantic Hints Presenting Proven Fixes from Vector Memory](screenshots/01_Frontend/S10_tech_failures_with_hints.png)
*Figure 10.7: Live Semantic Hints Presenting Proven Fixes from Vector Memory.*

#### 10.1.4 Ticket Closure & Automated Machine Recovery
Technicians close tickets by logging the action taken and repair cost. Stored procedure `sp_close_ticket` and triggers execute atomically:

![Figure 10.8: Ticket Closure Input Form](screenshots/01_Frontend/S10_tech_close_form.png)
*Figure 10.8: Ticket Closure Input Form.*

![Figure 10.9: Ticket Successfully Closed with Status Transition to RESOLVED](screenshots/01_Frontend/S10_tech_ticket_closed.png)
*Figure 10.9: Ticket Successfully Closed with Status Transition to RESOLVED.*

![Figure 10.10: Centralized Failures Register](screenshots/01_Frontend/03_Failures_List.png)
*Figure 10.10: Centralized Failures Register.*

#### 10.1.5 Semantic Failure Search Page
The dedicated semantic search portal enables operators to query the entire historical knowledge base using natural language, displaying confidence match percentages:

![Figure 10.11: Semantic Failure Search Querying ChromaDB](screenshots/03_MongoDB_ChromaDB/5_Similar_Failures.png)
*Figure 10.11: Semantic Failure Search Querying ChromaDB.*

![Figure 10.12: Semantic Search Results with Match Percentage & Past Actions](screenshots/03_MongoDB_ChromaDB/7_similar_results.png)
*Figure 10.12: Semantic Search Results with Match Percentage & Past Actions.*

#### 10.1.6 Sensor Telemetry Monitoring & Aggregation
Displays real-time IoT sensor readings from MongoDB with dynamic JSON metrics and statistical aggregation cards:

![Figure 10.13: Sensor Telemetry Monitor with Aggregation Cards](screenshots/03_MongoDB_ChromaDB/06_Sensor_Readings.png)
*Figure 10.13: Sensor Telemetry Monitor with Aggregation Cards.*

![Figure 10.14: Admin Action Deleting Sensor Telemetry Reading](screenshots/03_MongoDB_ChromaDB/S10_admin_delete_sensor.png)
*Figure 10.14: Admin Action Deleting Sensor Telemetry Reading.*

#### 10.1.7 Plant Administrator Panel
Accessible only to users with the `ADMIN` role, enabling registration of new machines, sub-assembly components, and certified technicians:

![Figure 10.15: Administrator Asset & Master Data Configuration Panel](screenshots/01_Frontend/S10_admin_panel.png)
*Figure 10.15: Administrator Asset & Master Data Configuration Panel.*

#### 10.1.8 FastAPI Backend & Interactive Swagger Documentation
![Figure 10.16: FastAPI Backend Startup Log & Database Connection Pools](screenshots/01_Frontend/08_FastAPI_Backend.png)
*Figure 10.16: FastAPI Backend Startup Log & Database Connection Pools.*

![Figure 10.17: FastAPI Swagger (OpenAPI) Interactive Documentation](screenshots/01_Frontend/09_FastAPI_Swagger.png)
*Figure 10.17: FastAPI Swagger (OpenAPI) Interactive Documentation.*

---

### 10.2 Authentication & Role-Based Access Control (RBAC)
Security is enforced through a defense-in-depth model combining application-layer JWT verification with native PostgreSQL database role enforcement:
1. **Database Roles (`role_admin` & `role_technician`):** In PostgreSQL, `role_admin` has full SELECT, INSERT, UPDATE, DELETE privileges across all tables. `role_technician` is granted SELECT on all tables, and INSERT/UPDATE exclusively on `failure` and `maintenance`. Technicians have zero access to `app_user` and are strictly barred from modifying or deleting master machine/component records.
2. **Connection Pool Routing:** The FastAPI backend maintains separate connection pools connecting as `app_admin` (in role `role_admin`) and `app_tech` (in role `role_technician`). Requests execute under the caller's verified database role, ensuring the database engine rejects unauthorized queries even if application logic were bypassed.

![Figure 10.18: PostgreSQL Roles List in Catalog](screenshots/04_Authentication/S8_roles_list.png)
*Figure 10.18: PostgreSQL Roles List in Catalog.*

![Figure 10.19: PostgreSQL Database GRANT Statements & Role Security Configuration](screenshots/04_Authentication/S10_code_grants.png)
*Figure 10.19: PostgreSQL Database GRANT Statements & Role Security Configuration.*

![Figure 10.20: FastAPI RBAC Middleware & Role-Based Connection Routing](screenshots/04_Authentication/S10_code_rbac.png)
*Figure 10.20: FastAPI RBAC Middleware & Role-Based Connection Routing.*

![Figure 10.21: RBAC Test: Admin Successfully Performing Administrative Mutation](screenshots/04_Authentication/S10_rbac_admin_allowed.png)
*Figure 10.21: RBAC Test: Admin Successfully Performing Administrative Mutation.*

![Figure 10.22: RBAC Test: Technician Denied (HTTP 403 / Insufficient Privilege)](screenshots/04_Authentication/10_rbac_technician_denied.png)
*Figure 10.22: RBAC Test: Technician Denied (HTTP 403 / Insufficient Privilege).*

![Figure 10.23: Technician UI With Administrative & Delete Controls Suppressed](screenshots/04_Authentication/S10_tech_no_admin_no_delete.png)
*Figure 10.23: Technician UI With Administrative & Delete Controls Suppressed.*

![Figure 10.24: Swagger JWT Authentication & Token Generation](screenshots/04_Authentication/S10_swagger_login.png)
*Figure 10.24: Swagger JWT Authentication & Token Generation.*

![Figure 10.25: Swagger Test: HTTP 401 Unauthorized When Accessing Without Token](screenshots/04_Authentication/S10_swagger_no_token_401.png)
*Figure 10.25: Swagger Test: HTTP 401 Unauthorized When Accessing Without Token.*

![Figure 10.26: Swagger Test: HTTP 403 Forbidden When Technician Accesses Admin Route](screenshots/04_Authentication/S10_swagger_tech_403.png)
*Figure 10.26: Swagger Test: HTTP 403 Forbidden When Technician Accesses Admin Route.*

![Figure 10.27: Multi-Container Docker Compose Deployment](screenshots/05_Documentation/Docker_Compose_Setup.png)
*Figure 10.27: Multi-Container Docker Compose Deployment.*

---

## 11. EVALUATION RUBRICS – COMPLETION STATUS

### 11.1 Rubric Criteria & Implementation Evidence Mapping

| # | Criteria | Distribution | Status & Evidence |
| :---: | :--- | :--- | :--- |
| **1** | **Database Design** | ER diagram, relational schema with keys, relationships, and constraints | **COMPLETED.** Detailed in Sections 3 & 4. Includes Strong/Weak entity analysis, non-simple attributes, recursive hierarchy, 3NF normalization proof, ER Diagram (Fig 3.1), and Relational Schema Diagram (Fig 4.1). |
| **2** | **Database Creation** | SQL database implementation - DDL with constraints, NoSQL/Vector database creation, Technology justification | **COMPLETED.** Detailed in Sections 2, 5 & 7. Full PostgreSQL DDL (`01_schema.sql`) with PKs, FKs (`CASCADE`/`SET NULL`), CHECK, UNIQUE, DEFAULT, and indexes (Figs 5.1-5.5). MongoDB collection setup and ChromaDB vector store creation with deep justifications. |
| **3** | **SQL Operations and Queries** | DML operations, Nested/correlated/Recursive SQL queries, Join SQL queries | **COMPLETED.** Detailed in Section 6. Validated INSERT, UPDATE, DELETE (Figs 6.1-6.3), Multi-table JOIN (Fig 6.4), Nested subquery (Fig 6.5), Correlated subquery (Fig 6.6), Recursive CTE (Fig 6.7), CTE + Window `RANK()` function (Fig 6.8), and Set `EXCEPT`. |
| **4** | **Advanced Database Concepts** | Advanced database concepts (Procedure/function, trigger, CTE), NoSQL/Vector feature RUD | **COMPLETED.** Detailed in Sections 6, 7 & 8. Stored Function `fn_open_failures`, Stored Procedures `sp_assign_technician` & `sp_close_ticket`, Triggers & Chaining (Figs 8.1-8.4), Analytical Views (Fig 8.5), ACID Transaction Rollback (Fig 8.6), MongoDB Aggregation & CRUD (Figs 7.1-7.4), ChromaDB Vector RUD (Figs 7.5-7.8). |
| **5** | **Web Application & Database Integration** | Next.js interface, Backend/API and database integration | **COMPLETED.** Detailed in Sections 9 & 10. Decoupled Next.js 14 frontend with reactive debounced hints, responsive dashboard, and sensor controls. FastAPI backend with multi-database connection pooling and Docker Compose orchestration (Figs 9.1, 10.1-10.17). |
| **6** | **Authentication and Authorization** | Authentication implementation (front end and backend) and minimum two roles and role-based access control in database | **COMPLETED.** Detailed in Section 10.2. Front-to-back JWT auth with PBKDF2 hashing. Dual roles (`ADMIN`, `TECHNICIAN`). PostgreSQL native database roles (`role_admin`, `role_technician`) with GRANTs/REVOKEs, tested via UI and Swagger (Figs 10.18-10.26). |
| **7** | **Documentation, Git/GitHub, Demonstration, Testing, and Originality** | Documentation, Git/GitHub, Originality and individual contribution | **COMPLETED.** Detailed in README, Sections 1, 9 & 11. Complete submittable report, Docker Compose reproducible setup, 57 verified screenshots, high originality solving industrial maintenance tribal knowledge silos. |

### 11.2 Individual Contribution Breakdown

| Team Member | SRN | Primary Responsibilities & Key Contributions |
| :--- | :--- | :--- |
| **KSHITIJ SATISH SHETTY** | **PES1UG24AM143** | • Conceptualized hybrid multi-model architecture (Relational + NoSQL + Vector).<br>• Designed 3NF PostgreSQL relational schema (`01_schema.sql`).<br>• Implemented PL/pgSQL stored procedures, triggers, trigger chaining, views, and database-level RBAC (`02_logic.sql`).<br>• Developed FastAPI backend middleware, connection pooling, and JWT authentication.<br>• Implemented ChromaDB persistent vector embedding pipeline and similarity search.<br>• Built Next.js reactive frontend UI, dashboard views, and live-hinting integration. |
| **MALLIKARJUNA RAO RV** | **PES1UG24AM155** | • Designed MongoDB polymorphic IoT telemetry document schema and PyMongo ingestion scripts.<br>• Implemented MongoDB real-time aggregation pipeline (grouping, average, max calculations).<br>• Orchestrated multi-container Docker Compose infrastructure (PostgreSQL 16, MongoDB 7).<br>• Formulated and benchmarked complex analytical SQL queries (JOIN, Nested, Correlated, Recursive CTE, Window function).<br>• Conducted ACID transaction rollback testing and constraint boundary validation.<br>• Authored system documentation, test execution logs, and compiled report deliverables. |

---
*Report compiled and verified against project deliverables. Ready for academic submission.*
