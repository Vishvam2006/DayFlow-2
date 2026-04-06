import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, Building2, CalendarCheck, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api.js";

const S = {
  page: { fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: "28px" },
  title: { fontSize: "26px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.5px" },
  sub: { color: "#64748b", fontSize: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" },
  card: { background: "#fff", borderRadius: "12px", padding: "22px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "all 0.2s", cursor: "default" },
  section: { background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: "20px" },
  sectionTitle: { fontSize: "15px", fontWeight: 600, color: "#0f172a", marginBottom: "16px" },
  pill: { padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, textDecoration: "none", transition: "all 0.15s" },
};

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
  <div style={S.card}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>{title}</p>
        <p style={{ fontSize: "30px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>{sub}</p>}
      </div>
      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={19} color={color} />
      </div>
    </div>
  </div>
);

const DashboardHome = () => {
  const [departmentCount, setDepartmentCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [deptR, empR, leaveR] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/department`, { headers }),
        axios.get(`${API_BASE_URL}/api/employee/get`, { headers }),
        axios.get(`${API_BASE_URL}/api/leave/leave-requests`, { headers }),
      ]);
      if (deptR.data.success) setDepartmentCount(deptR.data.departments.length);
      if (empR.data.success) setEmployeeCount(empR.data.employeesCount);
      if (leaveR.data.success) { setLeaveCount(leaveR.data.totalLeaves); setPendingCount(leaveR.data.pendingLeaves); }
    } catch (e) { console.log(e); }
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Admin Dashboard</h1>
        <p style={{ ...S.sub, display: "flex", alignItems: "center", gap: "5px" }}><Clock size={13} /> {today}</p>
      </div>

      <div style={S.grid}>
        <StatCard title="Total Employees" value={employeeCount} icon={Users} color="#4f46e5" sub="Active workforce" />
        <StatCard title="Departments" value={departmentCount} icon={Building2} color="#d97706" sub="Org units" />
        <StatCard title="Total Leaves" value={leaveCount} icon={CalendarCheck} color="#059669" sub="All requests" />
        <StatCard title="Pending Approvals" value={pendingCount} icon={TrendingUp} color="#dc2626" sub="Needs action" />
      </div>

      {/* Quick Actions */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Quick Actions</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { label: "Manage Departments", path: "/admin-dashboard/departments", color: "#4f46e5", bg: "#eef2ff" },
            { label: "Review Leaves", path: "/admin-dashboard/leaves", color: "#d97706", bg: "#fffbeb" },
            { label: "Assign Tasks", path: "/admin-dashboard/tasks", color: "#059669", bg: "#ecfdf5" },
            { label: "Run Payroll", path: "/admin-dashboard/payroll", color: "#dc2626", bg: "#fef2f2" },
          ].map(({ label, path, color, bg }) => (
            <button key={path} onClick={() => navigate(path)} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "9px", border: `1px solid ${color}30`,
              background: bg, color, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 12px ${color}20`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {label} <ArrowRight size={12} />
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={S.section}>
          <p style={S.sectionTitle}>Leave Breakdown</p>
          {[
            { label: "Approved", value: leaveCount - pendingCount, color: "#059669" },
            { label: "Pending Review", value: pendingCount, color: "#d97706" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "13px", color: "#475569" }}>{label}</span>
              </div>
              <span style={{ fontSize: "15px", fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={S.section}>
          <p style={S.sectionTitle}>Org Health</p>
          {[
            { label: "Avg team size", value: departmentCount > 0 ? Math.round(employeeCount / departmentCount) : "—" },
            { label: "Leave rate", value: employeeCount > 0 ? `${((leaveCount / employeeCount) * 100).toFixed(1)}%` : "—" },
            { label: "Active departments", value: departmentCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "13px", color: "#475569" }}>{label}</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
