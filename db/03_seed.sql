INSERT INTO technician (name,email,specialization) VALUES
 ('Ravi Kumar','ravi@plant.com','Mechanical'),('Anita Rao','anita@plant.com','Electrical'),('Imran Khan','imran@plant.com','Hydraulics');
INSERT INTO machine (name,location) VALUES ('CNC Lathe L1','Shop A'),('Hydraulic Press H2','Shop B'),('Conveyor C3','Shop A');
INSERT INTO component (machine_id,parent_component_id,name) VALUES
 (1,NULL,'Spindle Assembly'),(1,1,'Spindle Bearing'),(1,1,'Spindle Motor'),
 (2,NULL,'Hydraulic Circuit'),(2,4,'Main Pump'),(2,4,'Pressure Valve'),
 (3,NULL,'Drive Unit'),(3,7,'Drive Belt'),(3,7,'Gearbox');
INSERT INTO sensor (component_id,sensor_type,unit) VALUES
 (2,'VIBRATION','mm/s'),(3,'TEMPERATURE','C'),(5,'PRESSURE','bar'),(6,'PRESSURE','bar'),(9,'TEMPERATURE','C');
INSERT INTO failure (component_id,symptom_description,severity,status,reported_at,resolved_at) VALUES
 (2,'Loud grinding noise from spindle and high vibration at high RPM','HIGH','RESOLVED',now()-interval '40 days',now()-interval '39 days'),
 (5,'Pump making whining sound, pressure dropping below 120 bar','HIGH','RESOLVED',now()-interval '30 days',now()-interval '29 days'),
 (8,'Conveyor belt slipping and squealing under load','MEDIUM','RESOLVED',now()-interval '20 days',now()-interval '19 days'),
 (3,'Spindle motor overheating and tripping thermal protection','CRITICAL','RESOLVED',now()-interval '10 days',now()-interval '9 days');
INSERT INTO maintenance (failure_id,tech_id,action_taken,cost,started_at,completed_at) VALUES
 (1,1,'Replaced worn spindle bearing and re-greased; vibration back to normal',4500,now()-interval '40 days',now()-interval '39 days'),
 (2,3,'Replaced clogged suction filter and bled air from pump line',1200,now()-interval '30 days',now()-interval '29 days'),
 (3,1,'Re-tensioned belt and replaced glazed belt',800,now()-interval '20 days',now()-interval '19 days'),
 (4,2,'Cleaned cooling fins, replaced failed cooling fan',2100,now()-interval '10 days',now()-interval '9 days');
-- app users (admin/admin123, tech1/tech123) are created by the backend on startup
