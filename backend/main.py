"""FastAPI backend: PostgreSQL (relational) + MongoDB (sensor logs) + ChromaDB (vector search)."""
import os, hmac, hashlib, secrets, random, datetime as dt
from contextlib import contextmanager
from typing import Optional
import jwt, psycopg2, psycopg2.extras, chromadb
from psycopg2.pool import SimpleConnectionPool
from pymongo import MongoClient
from bson import ObjectId
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

SECRET = os.getenv("JWT_SECRET", "change-me-in-prod")
BASE = os.getenv("PG_BASE", "localhost:5432/maintenance_db")
DSN = {"OWNER": f"postgresql://postgres:postgres@{BASE}",
       "ADMIN": f"postgresql://app_admin:admin_pw@{BASE}",       # DB role: role_admin
       "TECHNICIAN": f"postgresql://app_tech:tech_pw@{BASE}"}    # DB role: role_technician
pools = {}
mongo = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
readings = mongo.maintenance_logs.readings
vec = chromadb.PersistentClient(path="chroma_store").get_or_create_collection("failure_reports")

app = FastAPI(title="Maintenance Traceability")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@contextmanager
def db(role):
    if role not in pools: pools[role] = SimpleConnectionPool(1, 5, DSN[role])
    conn = pools[role].getconn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            yield cur
        conn.commit()
    except psycopg2.errors.InsufficientPrivilege:
        conn.rollback(); raise HTTPException(403, "Denied by database role permissions")
    except psycopg2.Error as e:
        conn.rollback(); raise HTTPException(400, (e.pgerror or str(e)).split("\n")[0])
    except Exception:
        conn.rollback(); raise
    finally:
        pools[role].putconn(conn)

# ---------- auth ----------
def hash_pw(p, salt=None):
    salt = salt or secrets.token_hex(8)
    return f"{salt}${hashlib.pbkdf2_hmac('sha256', p.encode(), salt.encode(), 100_000).hex()}"
def check_pw(p, stored): return hmac.compare_digest(hash_pw(p, stored.split("$")[0]), stored)

def current_user(authorization: str = Header(None)):
    try: return jwt.decode((authorization or "").replace("Bearer ", ""), SECRET, algorithms=["HS256"])
    except Exception: raise HTTPException(401, "Invalid or missing token")
def need(*roles):
    def dep(u=Depends(current_user)):
        if u["role"] not in roles: raise HTTPException(403, f"Requires role: {'/'.join(roles)}")
        return u
    return dep
ANY, ADMIN = need("ADMIN", "TECHNICIAN"), need("ADMIN")

class Login(BaseModel): username: str; password: str
@app.post("/auth/login")
def login(b: Login):
    with db("OWNER") as cur:
        cur.execute("SELECT * FROM app_user WHERE username=%s", (b.username,)); u = cur.fetchone()
    if not u or not check_pw(b.password, u["password_hash"]): raise HTTPException(401, "Bad credentials")
    tok = jwt.encode({"sub": u["username"], "uid": u["user_id"], "role": u["role"],
                      "exp": dt.datetime.utcnow() + dt.timedelta(hours=8)}, SECRET, "HS256")
    return {"token": tok, "role": u["role"], "username": u["username"]}

# ---------- vector helpers ----------
def upsert_vec(fid):
    with db("OWNER") as cur:
        cur.execute("""SELECT f.symptom_description s, f.severity, f.status, c.name comp, m.name mach,
            (SELECT action_taken FROM maintenance WHERE failure_id=f.failure_id AND completed_at IS NOT NULL
             ORDER BY completed_at DESC LIMIT 1) fix
            FROM failure f JOIN component c USING(component_id) JOIN machine m USING(machine_id)
            WHERE f.failure_id=%s""", (fid,)); r = cur.fetchone()
    if r:
        vec.upsert(ids=[str(fid)], documents=[r["s"] + (f" | Fix: {r['fix']}" if r["fix"] else "")],
                   metadatas=[{"failure_id": fid, "machine": r["mach"], "component": r["comp"],
                               "severity": r["severity"], "status": r["status"]}])

@app.on_event("startup")
def startup():
    with db("OWNER") as cur:   # default users
        cur.execute("""INSERT INTO app_user (username,password_hash,role,tech_id) VALUES
            ('admin',%s,'ADMIN',NULL),('tech1',%s,'TECHNICIAN',1) ON CONFLICT DO NOTHING""",
            (hash_pw("admin123"), hash_pw("tech123")))
        cur.execute("SELECT failure_id FROM failure"); ids = [r["failure_id"] for r in cur.fetchall()]
    for i in ids:
        if not vec.get(ids=[str(i)])["ids"]: upsert_vec(i)
    if readings.count_documents({}) == 0:   # irregular sensor logs (different fields per sensor type)
        now = dt.datetime.utcnow(); docs = []
        for cid, typ in [(2, "VIBRATION"), (3, "TEMPERATURE"), (5, "PRESSURE"), (9, "TEMPERATURE")]:
            for h in range(24):
                d = {"value": round(random.uniform(1, 9) if typ == "VIBRATION" else random.uniform(40, 110) if typ == "TEMPERATURE" else random.uniform(110, 160), 2)}
                if typ == "VIBRATION": d.update(axis=random.choice("XYZ"), rms=round(random.uniform(.5, 4), 2))
                if typ == "TEMPERATURE": d.update(ambient=round(random.uniform(25, 35), 1))
                docs.append({"component_id": cid, "sensor_type": typ, "ts": now - dt.timedelta(hours=h), "data": d})
        readings.insert_many(docs)

# ---------- master data (SQL) ----------
def rows(role, sql, args=()):
    with db(role) as cur: cur.execute(sql, args); return cur.fetchall()
@app.get("/machines")
def machines(u=Depends(ANY)): return rows(u["role"], "SELECT * FROM machine ORDER BY machine_id")
@app.get("/components")
def components(machine_id: Optional[int] = None, u=Depends(ANY)):
    return rows(u["role"], """SELECT c.*, m.name machine FROM component c JOIN machine m USING(machine_id)
                              WHERE (%s IS NULL OR c.machine_id=%s) ORDER BY c.component_id""", (machine_id, machine_id))
@app.get("/technicians")
def technicians(u=Depends(ANY)): return rows(u["role"], "SELECT * FROM technician ORDER BY tech_id")
class MachineIn(BaseModel): name: str; location: str = ""
@app.post("/machines")
def add_machine(b: MachineIn, u=Depends(ADMIN)):
    return rows("ADMIN", "INSERT INTO machine (name,location) VALUES (%s,%s) RETURNING *", (b.name, b.location))[0]
class CompIn(BaseModel): machine_id: int; name: str; parent_component_id: Optional[int] = None
@app.post("/components")
def add_component(b: CompIn, u=Depends(ADMIN)):
    return rows("ADMIN", "INSERT INTO component (machine_id,name,parent_component_id) VALUES (%s,%s,%s) RETURNING *",
                (b.machine_id, b.name, b.parent_component_id))[0]
class TechIn(BaseModel): name: str; email: str; specialization: str = ""
@app.post("/technicians")
def add_tech(b: TechIn, u=Depends(ADMIN)):
    return rows("ADMIN", "INSERT INTO technician (name,email,specialization) VALUES (%s,%s,%s) RETURNING *",
                (b.name, b.email, b.specialization))[0]
@app.get("/views/open-failures")
def v1(u=Depends(ANY)): return rows(u["role"], "SELECT * FROM v_open_failures_per_machine")
@app.get("/views/workload")
def v2(u=Depends(ANY)): return rows(u["role"], "SELECT * FROM v_technician_workload")

# ---------- failures & maintenance (SQL transaction + vector sync) ----------
@app.get("/failures")
def failures(u=Depends(ANY)):
    return rows(u["role"], """SELECT f.failure_id, f.symptom_description, f.severity, f.status, f.reported_at,
        c.name component, m.name machine FROM failure f JOIN component c USING(component_id)
        JOIN machine m USING(machine_id) ORDER BY f.failure_id DESC""")
class FailIn(BaseModel): component_id: int; symptom_description: str; severity: str = "MEDIUM"; auto_assign: bool = False
@app.post("/failures")
def log_failure(b: FailIn, u=Depends(ANY)):
    with db(u["role"]) as cur:   # one transaction: failure (+ optional maintenance ticket)
        cur.execute("""INSERT INTO failure (component_id,reported_by,symptom_description,severity)
                       VALUES (%s,%s,%s,%s) RETURNING failure_id""", (b.component_id, u["uid"], b.symptom_description, b.severity))
        fid = cur.fetchone()["failure_id"]
        if b.auto_assign: cur.execute("CALL sp_assign_technician(%s, NULL, NULL::int)", (fid,))
    upsert_vec(fid)
    return {"failure_id": fid}
class AssignIn(BaseModel): tech_id: Optional[int] = None
@app.post("/failures/{fid}/assign")
def assign(fid: int, b: AssignIn, u=Depends(ANY)):
    with db(u["role"]) as cur:
        cur.execute("CALL sp_assign_technician(%s,%s,NULL::int)", (fid, b.tech_id)); r = cur.fetchone()
    upsert_vec(fid); return r
class CloseIn(BaseModel): action_taken: str; cost: float = 0
@app.post("/failures/{fid}/close")
def close(fid: int, b: CloseIn, u=Depends(ANY)):
    with db(u["role"]) as cur:
        cur.execute("SELECT maintenance_id FROM maintenance WHERE failure_id=%s AND completed_at IS NULL", (fid,))
        m = cur.fetchone()
        if not m: raise HTTPException(400, "No active maintenance ticket; assign a technician first")
        cur.execute("CALL sp_close_ticket(%s,%s,%s)", (m["maintenance_id"], b.action_taken, b.cost))
    upsert_vec(fid); return {"closed": fid}

# ---------- MongoDB: sensor logs (Create / Read / Update / Delete + aggregation) ----------
def clean(d): d["_id"] = str(d["_id"]); return d
class ReadIn(BaseModel): component_id: int; sensor_type: str; data: dict
@app.post("/sensors")
def add_reading(b: ReadIn, u=Depends(ANY)):
    r = readings.insert_one({**b.dict(), "ts": dt.datetime.utcnow()}); return {"_id": str(r.inserted_id)}
@app.get("/sensors")
def get_readings(component_id: Optional[int] = None, limit: int = 30, u=Depends(ANY)):
    q = {"component_id": component_id} if component_id else {}
    return [clean(d) for d in readings.find(q).sort("ts", -1).limit(limit)]
class UpdIn(BaseModel): data: dict
@app.put("/sensors/{rid}")
def upd_reading(rid: str, b: UpdIn, u=Depends(ANY)):
    r = readings.update_one({"_id": ObjectId(rid)}, {"$set": {f"data.{k}": v for k, v in b.data.items()}})
    if not r.matched_count: raise HTTPException(404, "Reading not found")
    return {"updated": rid}
@app.delete("/sensors/{rid}")
def del_reading(rid: str, u=Depends(ADMIN)):
    return {"deleted": readings.delete_one({"_id": ObjectId(rid)}).deleted_count}
@app.get("/sensors/summary")
def summary(u=Depends(ANY)):   # aggregation pipeline
    return list(readings.aggregate([
        {"$group": {"_id": {"component_id": "$component_id", "type": "$sensor_type"}, "avg": {"$avg": "$data.value"},
                    "max": {"$max": "$data.value"}, "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "component_id": "$_id.component_id", "type": "$_id.type",
                      "avg": {"$round": ["$avg", 2]}, "max": 1, "count": 1}}, {"$sort": {"component_id": 1}}]))

# ---------- Vector DB: similarity search (Read / Update / Delete) ----------
@app.get("/similar")
def similar(q: str, n: int = 5, u=Depends(ANY)):
    r = vec.query(query_texts=[q], n_results=min(n, max(vec.count(), 1)))
    return [{"failure_id": m["failure_id"], "distance": round(d, 3), "report": doc, **m}
            for m, d, doc in zip(r["metadatas"][0], r["distances"][0], r["documents"][0])]
class TextIn(BaseModel): symptom_description: str
@app.put("/reports/{fid}")
def edit_report(fid: int, b: TextIn, u=Depends(ANY)):
    with db(u["role"]) as cur:
        cur.execute("UPDATE failure SET symptom_description=%s WHERE failure_id=%s", (b.symptom_description, fid))
    upsert_vec(fid); return {"re_embedded": fid}
@app.delete("/reports/{fid}")
def del_report(fid: int, u=Depends(ADMIN)):
    vec.delete(ids=[str(fid)]); return {"removed_from_vector_index": fid}
