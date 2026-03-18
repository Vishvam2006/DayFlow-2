import React, { useEffect, useState } from "react";
import axios from "axios";

const S = { text: "#0f172a", sub: "#475569", muted: "#94a3b8", border: "#e2e8f0", green: "#059669", red: "#dc2626", amber: "#d97706", indigo: "#4f46e5", card: "#fff" };
const STATUS_COLORS = { Present: { bg: "#059669" }, Absent: { bg: "#dc2626" }, "Half Day": { bg: "#f59e0b" } };

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState({});
  const [stats, setStats] = useState({ Present: 0, Absent: 0, "Half Day": 0 });
  const year = new Date().getFullYear();

  useEffect(() => { fetchYearAttendance(); }, []);

  const fetchYearAttendance = async () => {
    try {
      const r = await axios.get("http://localhost:5000/api/attendance/year", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (r.data.success) {
        const map = {}, s = { Present: 0, Absent: 0, "Half Day": 0 };
        r.data.attendance.forEach(item => { const d = item.date.split("T")[0]; map[d] = item.status; if (s[item.status] !== undefined) s[item.status]++; });
        setAttendanceData(map); setStats(s);
      }
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[{ label: "Present", value: stats.Present, color: S.green, bg: "#f0fdf4" }, { label: "Half Day", value: stats["Half Day"], color: S.amber, bg: "#fffbeb" }, { label: "Absent", value: stats.Absent, color: S.red, bg: "#fef2f2" }].map(({ label, value, color, bg }) => (
          <div key={label} style={{ ...card, padding: "18px 22px", background: bg, borderColor: color + "30" }}>
            <p style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: "12px", color: S.muted, marginTop: "2px" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        {[["Present", "#059669"], ["Half Day", "#f59e0b"], ["Absent", "#dc2626"], ["No Data", "#e2e8f0"]].map(([label, color]) => (
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
                  const status = attendanceData[date];
                  const sc = STATUS_COLORS[status];
                  const isToday = date === new Date().toISOString().split("T")[0];
                  return (
                    <div key={day} title={status || "No data"} style={{ height: "25px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", fontSize: "10px", fontWeight: isToday ? 700 : 400, cursor: "default", background: sc ? sc.bg : "#f1f5f9", color: sc ? "#fff" : S.muted, border: isToday ? `2px solid ${S.indigo}` : "none", transition: "transform 0.1s" }}
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