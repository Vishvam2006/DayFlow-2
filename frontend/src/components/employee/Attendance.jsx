import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api.js";

const STATUS_COLORS = {
  Present: { bg: "bg-emerald-600", border: "border-emerald-600", text: "text-white" },
  "Half Day": { bg: "bg-amber-500", border: "border-amber-500", text: "text-white" },
  Leave: { bg: "bg-red-600", border: "border-red-600", text: "text-white" },
  "Leave Request": { bg: "bg-yellow-400", border: "border-yellow-400", text: "text-yellow-900" },
  Absent: { bg: "bg-slate-300", border: "border-slate-300", text: "text-slate-600" },
};

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState({});
  const [stats, setStats] = useState({ Present: 0, "Half Day": 0, Leave: 0, "Leave Request": 0 });
  const year = new Date().getFullYear();

  useEffect(() => { fetchCalendarData(); }, []);

  const fetchCalendarData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const [attendanceResponse, leaveResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/attendance/year`, { headers }),
        axios.get(`${API_BASE_URL}/api/leave/showLeave`, { headers }),
      ]);

      const map = {};
      const nextStats = { Present: 0, "Half Day": 0, Leave: 0, "Leave Request": 0 };

      if (attendanceResponse.data.success) {
        attendanceResponse.data.attendance.forEach((item) => {
          map[item.date] = {
            status: item.status,
            title: item.status,
          };
          if (nextStats[item.status] !== undefined) {
            nextStats[item.status] += 1;
          }
        });
      }

      if (leaveResponse.data.success) {
        leaveResponse.data.leaves.forEach((leave) => {
          if (leave.status === "Rejected") {
            return;
          }

          const visualStatus = leave.status === "Approved" ? "Leave" : "Leave Request";
          const cursor = new Date(leave.fromDate);
          const end = new Date(leave.toDate);
          cursor.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          for (const day = new Date(cursor); day <= end; day.setDate(day.getDate() + 1)) {
            if (day.getDay() === 0 || day.getDay() === 6) {
              continue;
            }

            const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const existing = map[dateKey];
            if (existing?.status === "Present" || existing?.status === "Half Day") {
              continue;
            }

            if (existing?.status && existing.status !== visualStatus && nextStats[existing.status] !== undefined) {
              nextStats[existing.status] = Math.max(0, nextStats[existing.status] - 1);
            }

            if (!existing || existing.status !== visualStatus) {
              nextStats[visualStatus] += 1;
            }

            map[dateKey] = {
              status: visualStatus,
              title: `${leave.leaveType} · ${leave.status}`,
            };
          }
        });
      }

      setAttendanceData(map);
      setStats(nextStats);
    } catch (e) {}
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[var(--color-text-primary)] tracking-tight">Attendance Calendar</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">Your attendance record for {year}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-[var(--radius-sm)] p-5">
          <p className="text-[28px] font-bold text-emerald-600 leading-tight">{stats.Present}</p>
          <p className="text-[12px] font-medium text-emerald-800/70 mt-1">Present</p>
        </div>
        <div className="bg-amber-50/50 border border-amber-200 rounded-[var(--radius-sm)] p-5">
          <p className="text-[28px] font-bold text-amber-500 leading-tight">{stats["Half Day"]}</p>
          <p className="text-[12px] font-medium text-amber-800/70 mt-1">Half Day</p>
        </div>
        <div className="bg-red-50/50 border border-red-200 rounded-[var(--radius-sm)] p-5">
          <p className="text-[28px] font-bold text-red-600 leading-tight">{stats.Leave}</p>
          <p className="text-[12px] font-medium text-red-800/70 mt-1">Leaves</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200/60 rounded-[var(--radius-sm)] p-5">
          <p className="text-[28px] font-bold text-yellow-700 leading-tight">{stats["Leave Request"]}</p>
          <p className="text-[12px] font-medium text-yellow-800/70 mt-1">Requests</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5">
        {[
          { label: "Present", color: "bg-emerald-600" },
          { label: "Leave", color: "bg-red-600" },
          { label: "Leave Request", color: "bg-yellow-400" },
          { label: "Half Day", color: "bg-amber-500" },
          { label: "No Data", color: "bg-slate-100 border border-slate-200" }
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${color}`}></div>
            <span className="text-[12px] text-slate-500 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Month Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, month) => {
          const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDay = new Date(year, month, 1).getDay();
          
          return (
            <div key={month} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-700 mb-3 uppercase tracking-wider">{monthName}</h3>
              <div className="grid grid-cols-7 gap-1">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-slate-400 font-bold py-1">{d}</div>
                ))}
                
                {[...Array(firstDay)].map((_, i) => <div key={`e${i}`}></div>)}
                
                {[...Array(daysInMonth)].map((_, day) => {
                  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`;
                  const dayData = attendanceData[date];
                  const status = dayData?.status;
                  const sc = STATUS_COLORS[status];
                  const isToday = date === new Date().toISOString().split("T")[0];
                  
                  return (
                    <div 
                      key={day} 
                      title={dayData?.title || status || "No data"} 
                      className={`h-7 flex items-center justify-center rounded-[4px] text-[11px] transition-transform hover:scale-110 cursor-default ${
                        sc ? `${sc.bg} ${sc.text}` : "bg-slate-100 text-slate-400"
                      } ${isToday ? "ring-2 ring-slate-900 font-bold ring-offset-1" : "font-medium"}`}
                    >
                      {day + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Attendance;
