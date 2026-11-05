"use client";
import { useState, useEffect, useCallback } from "react";
const API = process.env.NEXT_PUBLIC_API || "http://127.0.0.1:8000";

async function call(path, tok, method = "GET", body) {
  const r = await fetch(API + path, { method, headers: { "Content-Type": "application/json", ...(tok && { Authorization: "Bearer " + tok }) }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : "Request failed");
  return j;
}
const Badge = ({ v }) => <span className={"badge " + String(v).toLowerCase()}>{String(v).replace("_", " ")}</span>;
const day = d => (d ? new Date(d).toLocaleDateString() : "");
const Empty = ({ n, text }) => (n ? null : <p className="mute">{text}</p>);

export default function Home() {
  const [auth, setAuth] = useState(null), [tab, setTab] = useState("dashboard"), [toast, setToast] = useState(null);
  const [cred, setCred] = useState({ u: "", p: "" });
  const [d, setD] = useState({ failures: [], comps: [], machines: [], techs: [], open: [], work: [], sensors: [], summary: [] });
  const [fail, setFail] = useState({ c: "", sev: "MEDIUM", sym: "", auto: true }), [hints, setHints] = useState([]);
  const [closing, setClosing] = useState(null), [cl, setCl] = useState({ act: "", cost: "" });
  const [q, setQ] = useState(""), [results, setResults] = useState(null);
  const [rd, setRd] = useState({ c: "", t: "TEMPERATURE", v: "" });
  const [adm, setAdm] = useState({});
  const tok = auth?.token, admin = auth?.role === "ADMIN";

  const flash = (text, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast(null), 3500); };
  const load = useCallback(async () => {
    try {
      const [failures, comps, machines, techs, open, work, sensors, summary] = await Promise.all(
        ["/failures", "/components", "/machines", "/technicians", "/views/open-failures", "/views/workload", "/sensors", "/sensors/summary"].map(p => call(p, tok)));
      setD({ failures, comps, machines, techs, open, work, sensors, summary });
    } catch (e) { flash(e.message, false); }
  }, [tok]);
  const act = async (fn, ok) => { try { await fn(); flash(ok); await load(); } catch (e) { flash(e.message, false); } };

  useEffect(() => { try { const s = sessionStorage.getItem("auth"); if (s) setAuth(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { if (tok) load(); }, [tok, load]);
  useEffect(() => {   // live "similar past failures" while typing a symptom
    if (!tok || fail.sym.length < 8) { setHints([]); return; }
    const t = setTimeout(() => call("/similar?q=" + encodeURIComponent(fail.sym) + "&n=3", tok).then(setHints).catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [fail.sym, tok]);

  const login = async (u, p) => {
    try { const a = await call("/auth/login", null, "POST", { username: u, password: p }); setAuth(a); try { sessionStorage.setItem("auth", JSON.stringify(a)); } catch {} }
    catch (e) { flash(e.message, false); }
  };
  const logout = () => { setAuth(null); try { sessionStorage.removeItem("auth"); } catch {} };
  const label = id => { const c = d.comps.find(x => x.component_id === id); return c ? `${c.machine} / ${c.name}` : "Component " + id; };
  const doSearch = async () => { try { setResults(await call("/similar?q=" + encodeURIComponent(q) + "&n=5", tok)); } catch (e) { flash(e.message, false); } };
  const split = r => { const [s, ...f] = r.split(" | Fix: "); return [s, f.join(" | Fix: ")]; };

  if (!auth) return (<main><div className="card login"><h2>Maintenance Traceability</h2><p className="mute">Sign in to continue</p>
    <input placeholder="Username" value={cred.u} onChange={e => setCred({ ...cred, u: e.target.value })} />
    <input placeholder="Password" type="password" value={cred.p} onChange={e => setCred({ ...cred, p: e.target.value })} onKeyDown={e => e.key === "Enter" && login(cred.u, cred.p)} />
    <button style={{ width: "100%" }} onClick={() => login(cred.u, cred.p)}>Sign in</button>
    <p className="mute">Demo: <a href="#" onClick={e => { e.preventDefault(); setCred({ u: "admin", p: "admin123" }); }}>admin</a> · <a href="#" onClick={e => { e.preventDefault(); setCred({ u: "tech1", p: "tech123" }); }}>technician</a></p>
    {toast && <div className={"toast " + (toast.ok ? "" : "bad")}>{toast.text}</div>}</div></main>);

  const openCount = d.failures.filter(f => f.status !== "RESOLVED").length;
  return (<main>
    <header><div><h1>Maintenance Traceability</h1><small>{auth.username} · {auth.role}</small></div><button className="ghost" onClick={logout}>Log out</button></header>
    <nav>{[["dashboard", "Dashboard"], ["failures", "Failures"], ["search", "Search past failures"], ["sensors", "Sensors"], ...(admin ? [["admin", "Admin"]] : [])]
      .map(([k, n]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{n}</button>)}</nav>

    {tab === "dashboard" && <>
      <div className="grid"><div className="stat"><b>{d.machines.length}</b><span>Machines</span></div><div className="stat"><b>{openCount}</b><span>Unresolved failures</span></div>
        <div className="stat"><b>{d.failures.length - openCount}</b><span>Resolved failures</span></div><div className="stat"><b>{d.techs.length}</b><span>Technicians</span></div></div>
      <div className="card"><h3>Machine status <span className="mute">(view: open failures per machine)</span></h3>
        <table><thead><tr><th>Machine</th><th>Status</th><th>Open failures</th></tr></thead>
          <tbody>{d.open.map(m => <tr key={m.machine_id}><td>{m.machine}</td><td><Badge v={m.status} /></td><td>{m.open_failures}</td></tr>)}</tbody></table></div>
      <div className="card"><h3>Technician workload <span className="mute">(view)</span></h3>
        <table><thead><tr><th>Technician</th><th>Active tickets</th><th>Completed</th></tr></thead>
          <tbody>{d.work.map(t => <tr key={t.tech_id}><td>{t.name}</td><td>{t.active_tickets}</td><td>{t.completed_tickets}</td></tr>)}</tbody></table></div></>}

    {tab === "failures" && <>
      <div className="card"><h3>Report a failure</h3>
        <div className="row"><select className="grow" value={fail.c} onChange={e => setFail({ ...fail, c: e.target.value })}><option value="">Select component…</option>
          {d.comps.map(c => <option key={c.component_id} value={c.component_id}>{c.machine} / {c.name}</option>)}</select>
          <select value={fail.sev} onChange={e => setFail({ ...fail, sev: e.target.value })}>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(s => <option key={s}>{s}</option>)}</select></div>
        <textarea rows={3} placeholder="Describe the problem in plain words, e.g. “loud grinding noise and vibration”" value={fail.sym} onChange={e => setFail({ ...fail, sym: e.target.value })} />
        {hints.map(h => { const [s, f] = split(h.report); return <div className="hint" key={h.failure_id}><b>Similar past failure</b> — {h.machine} / {h.component}<br />{s}{f && <><br /><span className="fix">Fix that worked: {f}</span></>}</div>; })}
        <div className="row" style={{ marginTop: 10 }}><label><input type="checkbox" checked={fail.auto} onChange={e => setFail({ ...fail, auto: e.target.checked })} /> Auto-assign a technician</label>
          <button disabled={!fail.c || fail.sym.length < 5} onClick={() => act(async () => { await call("/failures", tok, "POST", { component_id: +fail.c, symptom_description: fail.sym, severity: fail.sev, auto_assign: fail.auto }); setFail({ c: "", sev: "MEDIUM", sym: "", auto: true }); }, "Failure logged")}>Log failure</button></div></div>
      {closing && <div className="card"><h3>Close failure #{closing}</h3><div className="row">
        <input className="grow" placeholder="What was done to fix it?" value={cl.act} onChange={e => setCl({ ...cl, act: e.target.value })} />
        <input type="number" placeholder="Cost" style={{ width: 110 }} value={cl.cost} onChange={e => setCl({ ...cl, cost: e.target.value })} />
        <button disabled={!cl.act} onClick={() => act(async () => { await call(`/failures/${closing}/close`, tok, "POST", { action_taken: cl.act, cost: +cl.cost || 0 }); setClosing(null); setCl({ act: "", cost: "" }); }, "Ticket closed")}>Close ticket</button>
        <button className="ghost" onClick={() => setClosing(null)}>Cancel</button></div></div>}
      <div className="card"><h3>All failures</h3><Empty n={d.failures.length} text="No failures yet." />
        <table><thead><tr><th>#</th><th>Machine / component</th><th>Symptom</th><th>Severity</th><th>Status</th><th>Reported</th><th></th></tr></thead>
          <tbody>{d.failures.map(f => <tr key={f.failure_id}><td>{f.failure_id}</td><td>{f.machine}<br /><span className="mute">{f.component}</span></td><td>{f.symptom_description}</td>
            <td><Badge v={f.severity} /></td><td><Badge v={f.status} /></td><td>{day(f.reported_at)}</td>
            <td>{f.status === "OPEN" && <button className="sm" onClick={() => act(() => call(`/failures/${f.failure_id}/assign`, tok, "POST", {}), "Technician assigned")}>Assign</button>}
              {f.status === "IN_PROGRESS" && <button className="sm" onClick={() => setClosing(f.failure_id)}>Close</button>}</td></tr>)}</tbody></table></div></>}

    {tab === "search" && <div className="card"><h3>Search past failures by meaning</h3>
      <div className="row"><input className="grow" placeholder="e.g. pump whining and low pressure" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} /><button onClick={doSearch}>Search</button></div>
      {results && !results.length && <p className="mute">No reports in the index.</p>}
      {results?.map(r => { const [s, f] = split(r.report); const pct = Math.max(0, Math.min(100, Math.round((1 - r.distance / 2) * 100)));
        return <div className="hint" key={r.failure_id}><div className="row"><b>#{r.failure_id} · {r.machine} / {r.component}</b><Badge v={r.severity} /><Badge v={r.status} /><span className="mute">{pct}% match</span></div>
          {s}{f && <><br /><span className="fix">Fix: {f}</span></>}<div className="row" style={{ marginTop: 6 }}>
            <button className="sm ghost" onClick={() => { const t = prompt("Edit symptom text", s); if (t) act(async () => { await call(`/reports/${r.failure_id}`, tok, "PUT", { symptom_description: t }); await doSearch(); }, "Report updated and re-embedded"); }}>Edit</button>
            {admin && <button className="sm red" onClick={() => act(async () => { await call(`/reports/${r.failure_id}`, tok, "DELETE"); await doSearch(); }, "Removed from search index")}>Remove from index</button>}</div></div>; })}</div>}

    {tab === "sensors" && <>
      <div className="grid">{d.summary.map((s, i) => <div className="stat" key={i}><span>{label(s.component_id)}</span><b>{s.avg}</b><span>avg {s.type.toLowerCase()} · max {s.max} · {s.count} readings</span></div>)}</div>
      <div className="card"><h3>Add a reading</h3><div className="row">
        <select className="grow" value={rd.c} onChange={e => setRd({ ...rd, c: e.target.value })}><option value="">Component…</option>{d.comps.map(c => <option key={c.component_id} value={c.component_id}>{c.machine} / {c.name}</option>)}</select>
        <select value={rd.t} onChange={e => setRd({ ...rd, t: e.target.value })}>{["TEMPERATURE", "VIBRATION", "PRESSURE"].map(s => <option key={s}>{s}</option>)}</select>
        <input type="number" placeholder="Value" style={{ width: 110 }} value={rd.v} onChange={e => setRd({ ...rd, v: e.target.value })} />
        <button disabled={!rd.c || rd.v === ""} onClick={() => act(async () => { await call("/sensors", tok, "POST", { component_id: +rd.c, sensor_type: rd.t, data: { value: +rd.v } }); setRd({ ...rd, v: "" }); }, "Reading added")}>Add</button></div></div>
      <div className="card"><h3>Latest readings <span className="mute">(stored in MongoDB)</span></h3>
        <table><thead><tr><th>Time</th><th>Component</th><th>Type</th><th>Data</th><th></th></tr></thead>
          <tbody>{d.sensors.slice(0, 12).map(s => <tr key={s._id}><td>{new Date(s.ts).toLocaleString()}</td><td>{label(s.component_id)}</td><td>{s.sensor_type}</td>
            <td>{Object.entries(s.data).map(([k, v]) => `${k}: ${v}`).join(" · ")}</td>
            <td><button className="sm ghost" onClick={() => { const v = prompt("New value", s.data.value); if (v !== null && v !== "") act(() => call("/sensors/" + s._id, tok, "PUT", { data: { value: +v } }), "Reading updated"); }}>Edit</button>{" "}
              {admin && <button className="sm red" onClick={() => act(() => call("/sensors/" + s._id, tok, "DELETE"), "Reading deleted")}>Delete</button>}</td></tr>)}</tbody></table></div></>}

    {tab === "admin" && <>
      <div className="card"><h3>Add machine</h3><div className="row"><input placeholder="Name" value={adm.mn || ""} onChange={e => setAdm({ ...adm, mn: e.target.value })} />
        <input placeholder="Location" value={adm.ml || ""} onChange={e => setAdm({ ...adm, ml: e.target.value })} />
        <button disabled={!adm.mn} onClick={() => act(async () => { await call("/machines", tok, "POST", { name: adm.mn, location: adm.ml || "" }); setAdm({ ...adm, mn: "", ml: "" }); }, "Machine added")}>Add</button></div></div>
      <div className="card"><h3>Add component</h3><div className="row"><select value={adm.cm || ""} onChange={e => setAdm({ ...adm, cm: e.target.value })}><option value="">Machine…</option>{d.machines.map(m => <option key={m.machine_id} value={m.machine_id}>{m.name}</option>)}</select>
        <input placeholder="Component name" value={adm.cn || ""} onChange={e => setAdm({ ...adm, cn: e.target.value })} />
        <button disabled={!adm.cm || !adm.cn} onClick={() => act(async () => { await call("/components", tok, "POST", { machine_id: +adm.cm, name: adm.cn }); setAdm({ ...adm, cn: "" }); }, "Component added")}>Add</button></div></div>
      <div className="card"><h3>Add technician</h3><div className="row"><input placeholder="Name" value={adm.tn || ""} onChange={e => setAdm({ ...adm, tn: e.target.value })} />
        <input placeholder="Email" value={adm.te || ""} onChange={e => setAdm({ ...adm, te: e.target.value })} /><input placeholder="Specialization" value={adm.ts || ""} onChange={e => setAdm({ ...adm, ts: e.target.value })} />
        <button disabled={!adm.tn || !adm.te} onClick={() => act(async () => { await call("/technicians", tok, "POST", { name: adm.tn, email: adm.te, specialization: adm.ts || "" }); setAdm({ ...adm, tn: "", te: "", ts: "" }); }, "Technician added")}>Add</button></div></div></>}

    {toast && <div className={"toast " + (toast.ok ? "" : "bad")}>{toast.text}</div>}
  </main>);
}
