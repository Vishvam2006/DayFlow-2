import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, CheckSquare, Clock, User, Calendar } from "lucide-react";

const C = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", indigo: "#4f46e5", green: "#059669", red: "#dc2626", amber: "#d97706", card: "#fff" };

const PRIORITY_CFG = { Low: { bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" }, Medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" }, High: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" } };
const STATUS_CFG = { "Pending": { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" }, "In Progress": { bg: "#eef2ff", text: "#4f46e5", border: "#c7d2fe" }, "Completed": { bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" } };

const AdminTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", priority: "Medium", dueDate: "" });
  const [submitting, setSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => { fetchTasks(); fetchEmployees(); }, []);

  const fetchTasks = async () => { try { const r = await axios.get("http://localhost:5000/api/task/all", { headers }); if (r.data.success) setTasks(r.data.tasks); } catch (e) {} };
  const fetchEmployees = async () => { try { const r = await axios.get("http://localhost:5000/api/employee/get", { headers }); if (r.data.success) setEmployees(r.data.employees || []); } catch (e) {} };
  const handleCreate = async () => {
    if (!form.title || !form.assignedTo) return;
    setSubmitting(true);
    try { const r = await axios.post("http://localhost:5000/api/task", form, { headers }); if (r.data.success) { fetchTasks(); setShowModal(false); setForm({ title: "", description: "", assignedTo: "", priority: "Medium", dueDate: "" }); } } catch (e) {}
    setSubmitting(false);
  };
  const handleDelete = async (id) => { try { await axios.delete(`http://localhost:5000/api/task/${id}`, { headers }); fetchTasks(); } catch (e) {} };

  const card = { background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };
  const inp = { width: "100%", padding: "10px 13px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", color: C.text, outline: "none" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>Task Manager</h1>
          <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Assign and track team tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
          <Plus size={15} /> Assign Task
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[{ label: "Total", value: tasks.length, color: C.indigo }, { label: "In Progress", value: tasks.filter(t => t.status === "In Progress").length, color: C.amber }, { label: "Completed", value: tasks.filter(t => t.status === "Completed").length, color: C.green }].map(({ label, value, color }) => (
          <div key={label} style={{ ...card, padding: "18px 20px" }}>
            <p style={{ fontSize: "26px", fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div style={{ ...card, overflow: "hidden" }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <CheckSquare size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p>No tasks yet. Click "Assign Task" to get started.</p>
          </div>
        ) : tasks.map((task, i) => {
          const pc = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;
          const sc = STATUS_CFG[task.status] || STATUS_CFG.Pending;
          return (
            <div key={task._id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderBottom: i < tasks.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: C.text, fontSize: "14px" }}>{task.title}</p>
                {task.description && <p style={{ color: C.muted, fontSize: "12px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.description}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: C.sub, display: "flex", alignItems: "center", gap: "4px" }}><User size={11} />{task.assignedTo?.name}</span>
                  {task.dueDate && <span style={{ fontSize: "12px", color: C.muted, display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={11} />{new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>{task.priority}</span>
              <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, whiteSpace: "nowrap" }}>{task.status}</span>
              <button onClick={() => handleDelete(task._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", opacity: 0.5, padding: "4px" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: C.text, marginBottom: "22px" }}>Assign New Task</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[{ label: "Task Title *", key: "title", type: "text", placeholder: "e.g. Complete Q1 report" }, { label: "Description", key: "description", type: "textarea", placeholder: "Task details..." }].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>{label}</label>
                  {type === "textarea" ? <textarea style={{ ...inp, resize: "vertical", minHeight: "72px" }} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /> : <input style={inp} type="text" placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />}
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Assign To *</label>
                <select style={{ ...inp, cursor: "pointer" }} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Priority</label>
                  <select style={{ ...inp, cursor: "pointer" }} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Due Date</label>
                  <input type="date" style={inp} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleCreate} disabled={submitting} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Assigning…" : "Assign Task"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskManager;
