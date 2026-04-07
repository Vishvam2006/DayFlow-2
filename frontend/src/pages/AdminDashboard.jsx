import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/dashboard/AdminNavbar";

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-primary)]">
      <AdminNavbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 p-8 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isCollapsed ? 'ml-[80px]' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
