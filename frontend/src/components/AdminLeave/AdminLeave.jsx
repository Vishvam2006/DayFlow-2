import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import API_BASE_URL from "../../config/api.js";

const C = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", indigo: "#4f46e5", green: "#059669", red: "#dc2626", amber: "#d97706", card: "#fff" };
const S_CFG = { Approved: { bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" }, Rejected: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" }, Pending: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" } };

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchLeaves = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/leave/leave-requests`, {
        headers,
      });
      if (r.data.success) setLeaves(r.data.allLeaves);
    } catch (error) {
      console.error("Failed to fetch leave requests:", error);
    }
  }, [headers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaves();
  }, [fetchLeaves]);

  const update = async (id, status) => {
    try {
      const r = await axios.put(
        `${API_BASE_URL}/api/leave/update-status/${id}`,
        { status },
        { headers }
      );
      if (r.data.success) {
        fetchLeaves();
        setSelected(null);
      }
    } catch (error) {
      console.error("Failed to update leave status:", error);
    }
  };

  const filtered = filter === "All" ? leaves : leaves.filter(l => l.status === filter);
  const card = { background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>Leave Requests</h1>
          <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Review and action employee leave requests</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {[{ label: "Pending", value: leaves.filter(l => l.status === "Pending").length, color: C.amber }, { label: "Approved", value: leaves.filter(l => l.status === "Approved").length, color: C.green }].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: "10px 18px", textAlign: "center", minWidth: "80px" }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color }}>{value}</p>
              <p style={{ fontSize: "11px", color: C.muted }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
        {["All", "Pending", "Approved", "Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: "1px solid", borderColor: filter === f ? "#c7d2fe" : C.border, background: filter === f ? "#eef2ff" : "#fff", color: filter === f ? C.indigo : C.sub, transition: "all 0.15s" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ ...card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid #f1f5f9`, background: "#fafafa" }}>
              {["Employee", "Leave Type", "Duration", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", color: C.muted, fontSize: "14px" }}>No requests found</td></tr>}
            {filtered.map((leave, i) => {
              const sc = S_CFG[leave.status] || S_CFG.Pending;
              return (
                <tr key={leave._id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid #f8fafc` : "none", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#fafafa"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 18px", fontWeight: 600, color: C.text, fontSize: "13.5px" }}>{leave.employee?.name || "—"}</td>
                  <td style={{ padding: "13px 18px", color: C.sub, fontSize: "13px" }}>{leave.leaveType} Leave</td>
                  <td style={{ padding: "13px 18px", color: C.sub, fontSize: "13px" }}>{leave.fromDate} — {leave.toDate}</td>
                  <td style={{ padding: "13px 18px" }}><span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{leave.status}</span></td>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button onClick={() => setSelected(leave)} style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px" }}><Eye size={11} /> View</button>
                      {leave.status === "Pending" && (
                        <>
                          <button onClick={() => update(leave._id, "Approved")} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: C.green, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px" }}><CheckCircle2 size={11} /> Approve</button>
                          <button onClick={() => update(leave._id, "Rejected")} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #fecaca", background: "#fef2f2", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px" }}><XCircle size={11} /> Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>Leave Details</h2>
            <p style={{ color: C.muted, fontSize: "12px", marginBottom: "20px" }}>{selected.employee?.name}</p>
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px 16px", marginBottom: "18px" }}>
              <p style={{ fontSize: "13px", color: C.sub, lineHeight: 1.7 }}><strong style={{ color: C.text }}>Reason:</strong> {selected.reason || "No reason provided"}</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {selected.status === "Pending" && (
                <>
                  <button onClick={() => update(selected._id, "Approved")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#059669", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Approve</button>
                  <button onClick={() => update(selected._id, "Rejected")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Reject</button>
                </>
              )}
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, fontWeight: 500, cursor: "pointer", fontSize: "13px" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;
