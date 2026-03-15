import React from "react";
import EmployeeNavbar from "../components/dashboard/EmployeeNavbar";
import { NavLink, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

const EmployeeDashboard = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <EmployeeNavbar />

      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeDashboard;
