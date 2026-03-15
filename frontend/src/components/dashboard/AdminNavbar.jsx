import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `transition font-medium ${
      isActive
        ? "text-teal-600 border-b-2 border-teal-600"
        : "text-gray-700 hover:text-teal-600"
    }`;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-white/60 border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <h1 className="text-xl font-bold text-teal-700 tracking-wide">
          DayFlow HRMS
        </h1>

        {/* Nav Links */}
        <div className="hidden md:flex gap-8">
          <NavLink to="/admin-dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/admin/employees" className={navLinkClass}>
            Employees
          </NavLink>

          <NavLink to="/admin-dashboard/departments" className={navLinkClass} >
            Departments
          </NavLink>

          <NavLink to="/admin-dashboard/leaves" className={navLinkClass}>
            Leaves
          </NavLink>

          <NavLink to="/admin/salary" className={navLinkClass}>
            Salary
          </NavLink>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700">
            Welcome, {user?.role || "Admin"}
          </span>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
};

export default AdminNavbar;
