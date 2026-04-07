import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import EmployeeNavbar from "../components/dashboard/EmployeeNavbar";

const EmployeeDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] font-sans antialiased text-[var(--color-text-primary)]">
      <EmployeeNavbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 p-8 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isCollapsed ? 'ml-[80px]' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeDashboard;
