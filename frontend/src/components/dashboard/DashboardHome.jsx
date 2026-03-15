import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import axios from "axios";
import { Users, Building2, DollarSign, CalendarCheck } from "lucide-react";

const DashboardHome = () => {
  const [departmentCount, setDepartmentCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchDepartmentCount();
    fetchEmployeeCount();
    fetchLeaveCount();
  }, []);

  const fetchLeaveCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/leave/leave-requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setLeaveCount(response.data.totalLeaves);
        setPendingCount(response.data.pendingLeaves)
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchEmployeeCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/employee/get",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setEmployeeCount(response.data.employeesCount);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchDepartmentCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/department",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setDepartmentCount(response.data.departments.length);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of employees, departments and leave activity
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard
          title="Total Employees"
          value={employeeCount}
          color="bg-teal-500"
          icon={Users}
        />

        <StatCard
          title="Departments"
          value={departmentCount}
          color="bg-yellow-500"
          icon={Building2}
        />

        <StatCard
          title="Monthly Payroll"
          value="$2500"
          color="bg-red-500"
          icon={DollarSign}
        />
      </div>

      {/* Leave Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Leave Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Leave Applied"
            value={leaveCount}
            color="bg-indigo-500"
            icon={CalendarCheck}
          />

          <StatCard
            title="Pending Approvals"
            value={pendingCount}
            color="bg-orange-500"
            icon={CalendarCheck}
          />
        </div>
      </div>

    </div>
  );
};

export default DashboardHome;