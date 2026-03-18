import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Building2 } from "lucide-react";

const C = { text: "#0f172a", sub: "#475569", border: "#e2e8f0", indigo: "#4f46e5", card: "#fff" };
const inp = { width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "9px", fontSize: "14px", color: C.text, outline: "none" };

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dep, setDep] = useState({ dep_name: "", description: "" });
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => { axios.get(`http://localhost:5000/api/department/${id}`, { headers }).then(r => { if (r.data.success) setDep(r.data.department); }).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await axios.put(`http://localhost:5000/api/department/${id}`, dep, { headers }); navigate("/admin-dashboard/departments"); } catch (e) {}
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>Edit Department</h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>Update department information</p>
      </div>
      <form onSubmit={handleSubmit} style={{ maxWidth: "500px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={22} color={C.indigo} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Department Name</label>
          <input type="text" style={inp} value={dep.dep_name} onChange={e => setDep({ ...dep, dep_name: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.sub, marginBottom: "6px" }}>Description</label>
          <textarea rows={4} style={{ ...inp, resize: "vertical" }} value={dep.description} onChange={e => setDep({ ...dep, description: e.target.value })} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" style={{ flex: 1, padding: "11px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Save Changes</button>
          <button type="button" onClick={() => navigate("/admin-dashboard/departments")} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: `1px solid ${C.border}`, background: "#fff", color: C.sub, fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditDepartment;
