import React from "react";
import { useAuth } from "../context/authContext";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/dashboard/AdminNavbar";

const AdminDashboard = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9", fontFamily: "'Inter', sans-serif" }}>
      <AdminNavbar />
      <main style={{ marginLeft: "256px", flex: 1, padding: "32px 36px", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
