import React from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate, NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, CalendarCheck, CalendarDays, User, LogOut, Zap } from "lucide-react";

const EmployeeNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };

  const navItems = [
    { to: "/employee-dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/employee-dashboard/tasks", icon: ClipboardList, label: "My Tasks" },
    { to: "/employee-dashboard/attendance", icon: CalendarCheck, label: "Attendance" },
    { to: "/employee-dashboard/leave-request", icon: CalendarDays, label: "Leave" },
    { to: "/employee-dashboard/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside style={{ width: "256px", height: "100vh", background: "#fff", borderRight: "1px solid #e2e8f0", position: "fixed", left: 0, top: 0, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", zIndex: 50, boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} color="white" />
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>DayFlow</p>
            <p style={{ fontSize: "10px", color: "#059669", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" }}>Employee Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", padding: "0 8px 8px" }}>Menu</p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 10px", borderRadius: "9px", marginBottom: "3px",
            textDecoration: "none", fontSize: "13.5px", fontWeight: isActive ? 600 : 400,
            background: isActive ? "#ecfdf5" : "transparent",
            color: isActive ? "#059669" : "#475569",
            border: isActive ? "1px solid #d1fae5" : "1px solid transparent",
            transition: "all 0.15s",
          })}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 12px 18px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "9px", background: "#f8fafc", marginBottom: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: "13px", flexShrink: 0 }}>
            {(user?.name || "E").charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Employee"}</p>
            <p style={{ fontSize: "11px", color: "#059669" }}>Team Member</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "9px 10px", borderRadius: "9px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default EmployeeNavbar;
