import React, { useEffect, useState } from "react";
import {
  Users, Trash2, RefreshCw, Search, UserCircle,
  Briefcase, Building2, BadgeCheck, AlertTriangle,
} from "lucide-react";
import API_BASE_URL from "../../config/api.js";
import { formatCurrency, getGrossFromStructure } from "../../utils/payroll.js";

const EmployeeList = ({ refreshKey }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // employee object

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/employee/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch employees.");
      setEmployees(data.employees);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [refreshKey]);

  const handleDelete = async (employee) => {
    setDeletingId(employee._id);
    setConfirmDelete(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/employee/${employee._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEmployees(prev => prev.filter(e => e._id !== employee._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.jobTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const avatarColor = (name) => {
    const colors = ["#4f46e5","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", padding: "30px 28px",
            maxWidth: "380px", width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}>
            <div style={{
              width: "46px", height: "46px", borderRadius: "13px", background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px",
            }}>
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Delete Employee?
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 22px", lineHeight: 1.6 }}>
              This will permanently remove <strong>{confirmDelete.name}</strong> and revoke their
              access. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: "10px", borderRadius: "9px", border: "1.5px solid #e2e8f0",
                background: "#f8fafc", color: "#475569", fontSize: "13.5px", fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: "10px", borderRadius: "9px", border: "none",
                background: "#dc2626", color: "white", fontSize: "13.5px", fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "20px", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "11px",
            background: "linear-gradient(135deg,#4f46e5,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={18} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Employee Directory
            </h2>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
              {employees.length} employee{employees.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employees…"
              style={{
                paddingLeft: "32px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px",
                border: "1.5px solid #e2e8f0", borderRadius: "9px", fontSize: "13px",
                outline: "none", color: "#0f172a", background: "#fff",
                fontFamily: "'Inter', sans-serif", width: "200px",
              }}
            />
          </div>
          {/* Refresh */}
          <button onClick={fetchEmployees} title="Refresh" style={{
            background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: "9px",
            padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center",
          }}>
            <RefreshCw size={14} color="#64748b" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "9px",
          padding: "11px 14px", marginBottom: "16px", fontSize: "13.5px", color: "#dc2626",
          display: "flex", gap: "8px", alignItems: "center",
        }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "60px 20px", color: "#94a3b8", fontSize: "14px",
        }}>
          <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", marginRight: "10px" }} />
          Loading employees…
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "#f8fafc", borderRadius: "14px", border: "1.5px dashed #e2e8f0",
        }}>
          <UserCircle size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
            {search ? "No employees match your search." : "No employees yet. Add one to get started."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(emp => (
            <div key={emp._id} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px 16px", background: "#fff", borderRadius: "12px",
              border: "1.5px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(79,70,229,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}
            >
              {/* Avatar */}
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
                background: `linear-gradient(135deg,${avatarColor(emp.name)},${avatarColor(emp.name)}aa)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: "16px",
              }}>
                {emp.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{emp.name}</span>
                  {emp.employeeId && (
                    <span style={{
                      fontSize: "11px", color: "#4f46e5", background: "#eef2ff",
                      padding: "2px 7px", borderRadius: "6px", fontWeight: 600,
                    }}>
                      {emp.employeeId}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {emp.email}
                </p>
              </div>

              {/* Job & Dept */}
              <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
                {emp.jobTitle && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Briefcase size={12} color="#94a3b8" />
                    <span style={{ fontSize: "12.5px", color: "#475569" }}>{emp.jobTitle}</span>
                  </div>
                )}
                {emp.department && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Building2 size={12} color="#94a3b8" />
                    <span style={{ fontSize: "12.5px", color: "#475569" }}>{emp.department}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Briefcase size={12} color="#94a3b8" />
                  <span style={{ fontSize: "12.5px", color: "#475569" }}>
                    Gross {formatCurrency(getGrossFromStructure(emp.salaryStructure))}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <BadgeCheck size={13} color="#10b981" />
                <span style={{ fontSize: "11.5px", color: "#10b981", fontWeight: 600 }}>Active</span>
              </div>

              {/* Delete */}
              <button
                onClick={() => setConfirmDelete(emp)}
                disabled={deletingId === emp._id}
                title="Delete employee"
                style={{
                  background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "8px",
                  padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center",
                  flexShrink: 0, opacity: deletingId === emp._id ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
              >
                <Trash2 size={14} color="#dc2626" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
