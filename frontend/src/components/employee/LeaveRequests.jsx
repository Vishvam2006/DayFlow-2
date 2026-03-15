import axios from "axios";
import React, { useEffect, useState } from "react";

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/leave/showLeave",
        {
          headers: {
            Authorization : `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.data.success) {
        setLeaves(response.data.leaves);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">
          My Leave Requests
        </h1>
        <p className="text-sm text-slate-500">
          Track the status of your applied leaves
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-700">Applied Leaves</h2>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Applied On</th>
              <th className="px-6 py-3 text-left font-medium">Leave Type</th>
              <th className="px-6 py-3 text-left font-medium">Duration</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave._id} className="border-t">
                  <td className="px-6 py-4">
                    {new Date(leave.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">{leave.leaveType} Leave</td>

                  <td className="px-6 py-4">
                    {new Date(leave.fromDate).toLocaleDateString()} –{" "}
                    {new Date(leave.toDate).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        leave.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : leave.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-500">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default LeaveRequests;
