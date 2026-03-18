import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { Plus, Pencil, Trash2, Building2, Search } from "lucide-react";

const C = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", indigo: "#4f46e5", red: "#dc2626", card: "#fff" };

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => { fetchDepartments(); }, []);
  const fetchDepartments = async () => { try { const r = await axios.get("http://localhost:5000/api/department", { headers }); if (r.data.success) setDepartments(r.data.departments); } catch (e) {} };
  const handleDelete = async (id) => { if (!window.confirm("Delete this department?")) return; try { await axios.delete(`http://localhost:5000/api/department/${id}`, { headers }); setDepartments(prev => prev.filter(d => d._id !== id)); } catch (e) {} };

  const filtered = departments.filter(d => d.dep_name.toLowerCase().includes(search.toLowerCase()));
  const card = { background: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>Departments</h1>
          <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>{departments.length} departments in organization</p>
        </div>
        <NavLink to="/admin-dashboard/add-new-department" style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "9px", textDecoration: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
          <Plus size={14} /> Add Department
        </NavLink>
      </div>

      <div style={{ position: "relative", marginBottom: "18px", maxWidth: "280px" }}>
        <Search size={14} color={C.muted} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments…" style={{ width: "100%", padding: "9px 12px 9px 34px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: "9px", fontSize: "13px", color: C.text, outline: "none" }} onFocus={e => e.target.style.borderColor = C.indigo} onBlur={e => e.target.style.borderColor = C.border} />
      </div>

      <div style={{ ...card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
              {["#", "Department", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "60px", color: C.muted }}>
                <Building2 size={36} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
                <p>No departments found</p>
              </td></tr>
            )}
            {filtered.map((dep, i) => (
              <tr key={dep._id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#fafafa"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "13px 18px", color: C.muted, fontSize: "13px" }}>{i + 1}</td>
                <td style={{ padding: "13px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={14} color={C.indigo} />
                    </div>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: "14px" }}>{dep.dep_name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 18px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <NavLink to={`/admin-dashboard/departments/edit/${dep._id}`} style={{ padding: "6px 12px", borderRadius: "7px", border: "1px solid #c7d2fe", background: "#eef2ff", color: C.indigo, fontSize: "12px", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Pencil size={11} /> Edit
                    </NavLink>
                    <button onClick={() => handleDelete(dep._id)} style={{ padding: "6px 12px", borderRadius: "7px", border: "1px solid #fecaca", background: "#fef2f2", color: C.red, fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Department;
