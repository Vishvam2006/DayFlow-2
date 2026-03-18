import React, { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardList, CheckCircle2, Clock, Circle, Calendar } from "lucide-react";

const C = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", indigo: "#4f46e5", green: "#059669", red: "#dc2626", amber: "#d97706", card: "#fff" };
const STATUS_CFG = { "Pending": { icon: Circle, color: C.muted, bg: "#f8fafc", border: "#e2e8f0" }, "In Progress": { icon: Clock, color: C.indigo, bg: "#eef2ff", border: "#c7d2fe" }, "Completed": { icon: CheckCircle2, color: C.green, bg: "#f0fdf4", border: "#bbf7d0" } };
const PRIORITY_COLORS = { Low: C.green, Medium: C.amber, High: C.red };

const EmployeeTaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => { fetchMyTasks(); }, []);

  const fetchMyTasks = async () => { try { const r = await axios.get("http://localhost:5000/api/task/my-tasks", { headers }); if (r.data.success) setTasks(r.data.tasks); } catch (e) {} };
  const handleStatusChange = async (id, status) => { try { const r = await axios.put(`http://localhost:5000/api/task/${id}/status`, { status }, { headers }); if (r.data.success) fetchMyTasks(); } catch (e) {} };

  const card = { background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>My Tasks</h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Track and update your assigned work</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "22px" }}>
        {[{ label: "To Do", value: tasks.filter(t => t.status === "Pending").length, color: C.muted }, { label: "In Progress", value: tasks.filter(t => t.status === "In Progress").length, color: C.indigo }, { label: "Completed", value: tasks.filter(t => t.status === "Completed").length, color: C.green }].map(({ label, value, color }) => (
          <div key={label} style={{ ...card, padding: "18px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>{label}</p>
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>
          <ClipboardList size={48} style={{ margin: "0 auto 14px", opacity: 0.25 }} />
          <p style={{ fontSize: "15px" }}>No tasks assigned yet</p>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>Tasks from your admin will appear here</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
          {tasks.map(task => {
            const sc = STATUS_CFG[task.status];
            const Ic = sc.icon;
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";
            return (
              <div key={task._id} style={{ ...card, padding: "18px 20px", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <p style={{ fontWeight: 600, color: C.text, fontSize: "14px", flex: 1, marginRight: "8px" }}>{task.title}</p>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: PRIORITY_COLORS[task.priority], background: `${PRIORITY_COLORS[task.priority]}18`, padding: "2px 8px", borderRadius: "999px", border: `1px solid ${PRIORITY_COLORS[task.priority]}30`, flexShrink: 0 }}>{task.priority}</span>
                </div>
                {task.description && <p style={{ color: C.muted, fontSize: "12px", marginBottom: "10px" }}>{task.description}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "13px" }}>
                  <Ic size={12} color={sc.color} />
                  <span style={{ fontSize: "11px", color: sc.color, fontWeight: 500 }}>{task.status}</span>
                  {task.dueDate && <span style={{ fontSize: "11px", color: isOverdue ? C.red : C.muted, display: "flex", alignItems: "center", gap: "3px" }}><Calendar size={10} />{new Date(task.dueDate).toLocaleDateString()}{isOverdue ? " · Overdue" : ""}</span>}
                </div>
                <div style={{ display: "flex", gap: "5px" }}>
                  {["Pending", "In Progress", "Completed"].map(s => {
                    const cfg = STATUS_CFG[s];
                    const isActive = task.status === s;
                    return (
                      <button key={s} onClick={() => handleStatusChange(task._id, s)} style={{ flex: 1, padding: "6px 4px", borderRadius: "7px", fontSize: "10px", fontWeight: 600, cursor: "pointer", background: isActive ? cfg.bg : "transparent", border: `1px solid ${isActive ? cfg.border : C.border}`, color: isActive ? cfg.color : C.muted, transition: "all 0.15s", whiteSpace: "nowrap" }}>
                        {s === "In Progress" ? "In Progress" : s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeTaskBoard;
