import React from "react";
import StatCard from "../components/dashboard/StatCard.jsx";
import { useAuth } from "../context/authContext";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/dashboard/AdminNavbar";

const AdminDashboard = () => {
  const {user} = useAuth();
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <div className="pt-28 px-8 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
