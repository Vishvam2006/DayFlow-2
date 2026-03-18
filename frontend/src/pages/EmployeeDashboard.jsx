import React from "react";
import { Outlet } from "react-router-dom";
import EmployeeNavbar from "../components/dashboard/EmployeeNavbar";

const EmployeeDashboard = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9", fontFamily: "'Inter', sans-serif" }}>
      <EmployeeNavbar />
      <main style={{ marginLeft: "256px", flex: 1, padding: "32px 36px", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeDashboard;
