import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Buildings,
  CalendarCheck,
  Clock,
  TrendUp,
  ArrowRight,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api.js";

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
  <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] p-5 border border-[var(--color-border)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          {title}
        </p>
        <p className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">{sub}</p>
        )}
      </div>
      <div
        className="w-[42px] h-[42px] rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon size={20} color={color} weight="fill" />
      </div>
    </div>
  </div>
);

const DashboardHome = () => {
  const [departmentCount, setDepartmentCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  const [approvedCount, setApprovedCount] = useState(0);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [deptR, empR, leaveR] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/department`, { headers }),
        axios.get(`${API_BASE_URL}/api/employee/get`, { headers }),
        axios.get(`${API_BASE_URL}/api/leave/leave-requests`, { headers }),
      ]);
      if (deptR.data.success) setDepartmentCount(deptR.data.departments.length);
      if (empR.data.success) setEmployeeCount(empR.data.employeesCount);
      if (leaveR.data.success) {
        setLeaveCount(leaveR.data.totalLeaves);
        setPendingCount(leaveR.data.pendingLeaves);
        setApprovedCount(leaveR.data.approvedLeaves); // ✅ ADD THIS
      }
    } catch (e) {
      console.log(e);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[26px] font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1.5">
          <Clock size={14} weight="bold" /> {today}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={employeeCount}
          icon={Users}
          color="#0f172a"
          sub="Active workforce"
        />
        <StatCard
          title="Departments"
          value={departmentCount}
          icon={Buildings}
          color="#0f172a"
          sub="Org units"
        />
        <StatCard
          title="Total Leaves"
          value={leaveCount}
          icon={CalendarCheck}
          color="#059669"
          sub="All requests"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          icon={TrendUp}
          color="#dc2626"
          sub="Needs action"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] p-6 border border-[var(--color-border)] shadow-sm mb-5">
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-4">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Manage Departments",
              path: "/admin-dashboard/departments",
            },
            { label: "Review Leaves", path: "/admin-dashboard/leaves" },
            { label: "Assign Tasks", path: "/admin-dashboard/tasks" },
            { label: "Run Payroll", path: "/admin-dashboard/payroll" },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-page)] text-[var(--color-text-primary)] text-[13px] font-medium transition-all hover:bg-slate-100 hover:border-slate-300"
            >
              {label} <ArrowRight size={12} weight="bold" />
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] p-6 border border-[var(--color-border)] shadow-sm">
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-4">
            Leave Breakdown
          </p>
          <div className="divide-y divide-[var(--color-border)]">
            {[
              {
                label: "Approved",
                value: approvedCount,
                color: "var(--color-success)",
              },
              {
                label: "Pending Review",
                value: pendingCount,
                color: "var(--color-warning)",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    {label}
                  </span>
                </div>
                <span className="text-[15px] font-bold" style={{ color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] p-6 border border-[var(--color-border)] shadow-sm">
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-4">
            Org Health
          </p>
          <div className="divide-y divide-[var(--color-border)]">
            {[
              {
                label: "Avg team size",
                value:
                  departmentCount > 0
                    ? Math.round(employeeCount / departmentCount)
                    : "—",
              },
              {
                label: "Leave rate",
                value:
                  employeeCount > 0
                    ? `${((leaveCount / employeeCount) * 100).toFixed(1)}%`
                    : "—",
              },
              { label: "Active departments", value: departmentCount },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5"
              >
                <span className="text-[13px] text-[var(--color-text-secondary)]">
                  {label}
                </span>
                <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
