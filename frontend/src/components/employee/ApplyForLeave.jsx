import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, CheckCircle2 } from "lucide-react";

const C = { text: "#0f172a", sub: "#475569", border: "#e2e8f0", indigo: "#4f46e5", green: "#059669", red: "#dc2626", card: "#fff" };
const inp = { width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "9px", fontSize: "14px", color: C.text, outline: "none" };

const ApplyForLeave = () => {
  const [leave, setLeave] = useState({ leaveType: "", fromDate: "", toDate: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try { const r = await axios.post("http://localhost:5000/api/leave/apply", leave, { headers }); if (r.data.success) setSubmitted(true); }
    catch (err) { setError(err.response?.data?.error || "Failed to submit request"); }
  };

  if (submitted) return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", textAlign: "center" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
        <CheckCircle2 size={28} color={C.green} />
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>Request Submitted!</h2>
      <p style={{ color: C.sub, marginBottom: "24px", fontSize: "14px" }}>Your leave request has been sent for approval.</p>
      <button onClick={() => navigate("/employee-dashboard")} style={{ padding: "10px 24px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Back to Dashboard</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>Apply for Leave</h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Submit a leave request for approval</p>
      </div>

      {error && <div style={{ padding: "11px 16px", borderRadius: "9px", marginBottom: "16px", background: "#fef2f2", border: "1px solid #fecaca", color: C.red, fontSize: "13px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: "540px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Leave Type *</label>
          <select required style={{ ...inp, cursor: "pointer" }} value={leave.leaveType} onChange={e => setLeave({ ...leave, leaveType: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border}>
            <option value="">Select type…</option>
            <option>Casual</option><option>Sick</option><option>Paid</option><option>Unpaid</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>From Date *</label>
            <input type="date" required style={inp} value={leave.fromDate} onChange={e => setLeave({ ...leave, fromDate: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>To Date *</label>
            <input type="date" required style={inp} value={leave.toDate} onChange={e => setLeave({ ...leave, toDate: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Reason</label>
          <textarea rows={4} placeholder="Brief reason for your absence…" style={{ ...inp, resize: "vertical" }} value={leave.reason} onChange={e => setLeave({ ...leave, reason: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" style={{ flex: 1, padding: "11px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <Send size={14} /> Submit Request
          </button>
          <button type="button" onClick={() => navigate("/employee-dashboard")} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ApplyForLeave;
