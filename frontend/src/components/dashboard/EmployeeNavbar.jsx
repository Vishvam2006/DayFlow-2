import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  User,
  LogOut,
} from "lucide-react";

const EmployeeNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 flex flex-col">
      
      {/* Brand */}
      <div className="px-6 py-5 border-b">
        <h1 className="text-xl font-bold text-indigo-600">
          DayFlow
        </h1>
        <p className="text-xs text-slate-500">
          Employee Portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/employee-dashboard" className={linkClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/employee-dashboard/attendance" className={linkClass}>
          <CalendarCheck size={18} />
          Attendance
        </NavLink>

        <NavLink to="/employee-dashboard/leave-request" className={linkClass}>
          <CalendarDays size={18} />
          Leave
        </NavLink>

        <NavLink to="/employee-dashboard/profile" className={linkClass}>
          <User size={18} />
          Profile
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t">
        <div className="mb-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.username}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default EmployeeNavbar;
