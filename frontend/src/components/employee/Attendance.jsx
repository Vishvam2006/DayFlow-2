import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api.js";

const S = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", green: "#059669", red: "#dc2626", amber: "#d97706", indigo: "#4f46e5", card: "#fff" };
const STATUS_COLORS = {
  Present: { bg: "#059669", label: "Present" },
  "Half Day": { bg: "#f59e0b", label: "Half Day" },
  Leave: { bg: "#dc2626", label: "Leave" },
  "Leave Request": { bg: "#eab308", label: "Leave Request", text: "#713f12" },
  Absent: { bg: "#cbd5e1", label: "Absent", text: "#475569" },
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

  const card = { background: S.card, borderRadius: "12px", border: `1px solid ${S.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: S.text, letterSpacing: "-0.4px" }}>Attendance Calendar</h1>
        <p style={{ color: S.sub, fontSize: "13px", marginTop: "3px" }}>Your attendance record for {year}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px", marginBottom: "24px" }}>
        {[{ label: "Present", value: stats.Present, color: S.green, bg: "#f0fdf4" }, { label: "Half Day", value: stats["Half Day"], color: S.amber, bg: "#fffbeb" }, { label: "Leaves", value: stats.Leave, color: S.red, bg: "#fef2f2" }, { label: "Requests", value: stats["Leave Request"], color: "#a16207", bg: "#fefce8" }].map(({ label, value, color, bg }) => (
          <div key={label} style={{ ...card, padding: "18px 22px", background: bg, borderColor: color + "30" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: "12px", color: S.muted, marginTop: "2px" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        {[["Present", "#059669"], ["Leave", "#dc2626"], ["Leave Request", "#eab308"], ["Half Day", "#f59e0b"], ["No Data", "#e2e8f0"]].map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: color }} />
            <span style={{ fontSize: "12px", color: S.sub }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Month Grids */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "14px" }}>
        {[...Array(12)].map((_, month) => {
          const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDay = new Date(year, month, 1).getDay();
          return (
            <div key={month} style={{ ...card, padding: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: S.sub, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{monthName}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: "9px", color: S.muted, fontWeight: 600, padding: "2px 0" }}>{d}</div>)}
                {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} />)}
                {[...Array(daysInMonth)].map((_, day) => {
                  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`;
                  const dayData = attendanceData[date];
                  const status = dayData?.status;
                  const sc = STATUS_COLORS[status];
                  const isToday = date === new Date().toISOString().split("T")[0];
                  return (
                    <div key={day} title={dayData?.title || status || "No data"} style={{ height: "25px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", fontSize: "10px", fontWeight: isToday ? 700 : 400, cursor: "default", background: sc ? sc.bg : "#f1f5f9", color: sc?.text || (sc ? "#fff" : S.muted), border: isToday ? `2px solid ${S.indigo}` : "none", transition: "transform 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >{day + 1}</div>
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
