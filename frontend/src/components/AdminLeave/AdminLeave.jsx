import axios from "axios";
import React, { useEffect, useState } from "react";

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [name, setName] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (leaveId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/leave/update-status/${leaveId}`,
        { status: "Approved" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data.success) {
        fetchLeaves();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReject = async (leaveId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/leave/update-status/${leaveId}`,
        { status: "Rejected" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data.success) {
        fetchLeaves();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/leave/leave-requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data.success) {
        console.log(response.data);
        setLeaves(response.data.allLeaves);
        setName(response.data.empName);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          Leave Requests
        </h1>
        <p className="text-sm text-slate-500">
          Review and manage employee leave requests
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-6 py-3 text-left">Employee</th>
              <th className="px-6 py-3 text-left">Leave Type</th>
              <th className="px-6 py-3 text-left">Duration</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id} className="border-t">
                <td className="px-6 py-4 font-medium">{leave.employee.name}</td>

                <td className="px-6 py-4">{leave.leaveType} Leave</td>

                <td className="px-6 py-4">
                  {leave.fromDate} - {leave.toDate}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${
                        leave.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : leave.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {leave.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center space-x-2">
                  <button
                    onClick={() => setSelectedLeave(leave)}
                    className="px-3 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300"
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleApprove(leave._id)}
                    className="px-3 py-1 text-xs rounded bg-green-500 text-white cursor-pointer"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(leave._id)}
                    className="px-3 py-1 text-xs rounded bg-red-500 text-white cursor-pointer"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedLeave && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={() => setSelectedLeave(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Leave Reason</h2>

            <p className="text-sm text-slate-600 mb-4">
              {selectedLeave.reason}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;
