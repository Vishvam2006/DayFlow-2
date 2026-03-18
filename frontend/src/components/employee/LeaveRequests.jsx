import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { CalendarDays, Plus } from "lucide-react";

const C = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", indigo: "#4f46e5", green: "#059669", red: "#dc2626", amber: "#d97706", card: "#fff" };
const SC = { Approved: { bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" }, Rejected: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" }, Pending: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" } };

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => { fetchLeaves(); }, []);
  const fetchLeaves = async () => { try { const r = await axios.get("http://localhost:5000/api/leave/showLeave", { headers }); if (r.data.success) setLeaves(r.data.leaves); } catch (e) {} };

  const card = { background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>My Leave History</h1>
          <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Track the status of your applied leaves</p>
        </div>
        <NavLink to="/employee-dashboard/apply-for-leave" style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "9px", textDecoration: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
          <Plus size={14} /> Apply Leave
        </NavLink>
      </div>

      <div style={{ ...card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid #f1f5f9`, background: "#fafafa" }}>
              {["Applied On", "Leave Type", "Duration", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "56px", color: C.muted }}>
                <CalendarDays size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p>No leave requests found</p>
              </td></tr>
            ) : leaves.map((leave, i) => {
              const sc = SC[leave.status] || SC.Pending;
              return (
                <tr key={leave._id} style={{ borderBottom: i < leaves.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#fafafa"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 18px", color: C.sub, fontSize: "13px" }}>{new Date(leave.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "13px 18px", fontWeight: 500, color: C.text, fontSize: "13px" }}>{leave.leaveType} Leave</td>
                  <td style={{ padding: "13px 18px", color: C.sub, fontSize: "13px" }}>{new Date(leave.fromDate).toLocaleDateString()} — {new Date(leave.toDate).toLocaleDateString()}</td>
                  <td style={{ padding: "13px 18px" }}><span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{leave.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveRequests;
