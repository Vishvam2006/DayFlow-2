import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Clock } from "lucide-react";

const EmployeeHome = () => {
  const [checkInTime, setCheckInTime] = useState(null);
  const [timer, setTimer] = useState("00:00:00");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getTodayAttendance();
  }, []);

  // TIMER LOGIC
  useEffect(() => {
    if (checkInTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = now - new Date(checkInTime);

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimer(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [checkInTime]);

  // GET TODAY ATTENDANCE
  const getTodayAttendance = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/attendance/today",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.attendance) {
        setCheckInTime(res.data.attendance.checkIn);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // CHECK IN
  const handleCheckIn = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/attendance/check-in",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Checked In Successfully");
        setCheckInTime(response.data.attendance.checkIn);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // CHECK OUT
  const handleCheckOut = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/attendance/check-out",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Checked Out Successfully");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* Header */}
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">
        Employee Dashboard
      </h1>

      <p className="text-sm text-slate-500 mb-4">
        Overview of your attendance and leave
      </p>

      {/* SMALL TIMER BAR */}
      <div className="bg-white border rounded-lg shadow-sm px-4 py-2 mb-6 flex items-center gap-4">
        <Clock size={18} className="text-gray-500" />

        <p className="text-sm text-gray-600">
          Check-In:
          <span className="font-semibold ml-1">
            {checkInTime
              ? new Date(checkInTime).toLocaleTimeString()
              : "--"}
          </span>
        </p>

        <p className="text-sm text-gray-600">
          Working:
          <span className="font-bold text-green-600 ml-1">
            {timer}
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Today</p>
          <h2 className="text-xl font-semibold text-green-600">
            {checkInTime ? "Working" : "Not Checked In"}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Leaves Taken</p>
          <h2 className="text-xl font-semibold">4</h2>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Pending Requests</p>
          <h2 className="text-xl font-semibold text-yellow-600">1</h2>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Mark Attendance</h3>

          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              // disabled={checkInTime}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm cursor-pointer"
            >
              Mark Check-In
            </button>

            <button
              onClick={handleCheckOut}
              // disabled={!checkInTime}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm cursor-pointer"
            >
              Mark Check-Out
            </button>
          </div>

          {message && (
            <p className="text-sm text-green-600 mt-3">{message}</p>
          )}
        </div>

        {/* Leave */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-1">Apply for Leave</h3>

          <p className="text-sm text-slate-500 mb-4">
            Request leave for upcoming days
          </p>

          <NavLink
            to="/employee-dashboard/apply-for-leave"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm cursor-pointer"
          >
            Apply For Leave
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default EmployeeHome;