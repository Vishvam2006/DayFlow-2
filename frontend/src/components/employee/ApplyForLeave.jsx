import axios from "axios";
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const ApplyForLeave = () => {
  const [leave, setLeave] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeave({ ...leave, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/leave/apply",
        leave,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data.success) {
        alert("Leave Applied Successfully");
        navigate("/employee-dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to apply leave");
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">
          Apply for Leave
        </h1>
        <p className="text-sm text-slate-500">
          Submit a leave request for approval
        </p>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-xl border shadow-sm p-6"
      >
        {/* Leave Type */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Leave Type
          </label>
          <select
            name="leaveType"
            value={leave.leaveType}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select leave type</option>
            <option value="Casual">Casual Leave</option>
            <option value="Sick">Sick Leave</option>
            <option value="Paid">Paid Leave</option>
            <option value="Unpaid">Unpaid Leave</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="fromDate"
              value={leave.fromDate}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              name="toDate"
              value={leave.toDate}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            name="reason"
            value={leave.reason}
            onChange={handleChange}
            rows="4"
            placeholder="Brief reason for leave"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Submit Request
          </button>

          <button
            type="button"
            onClick={() => navigate("/employee-dashboard")}
            className="px-5 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button> 
        </div>
      </form>
    </>
  );
};

export default ApplyForLeave;
