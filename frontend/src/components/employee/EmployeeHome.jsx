import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Clock, LogIn, LogOut, CheckCircle2, TrendingUp, ClipboardList } from "lucide-react";
import { useAuth } from "../../context/authContext";
import API_BASE_URL from "../../config/api.js";
import { formatCurrency, getCurrentMonthValue } from "../../utils/payroll.js";

const C = { white: "#fff", bg: "#f4f6f9", border: "#e2e8f0", text: "#0f172a", sub: "#64748b", muted: "#94a3b8", indigo: "#4f46e5", green: "#059669", red: "#dc2626", amber: "#d97706" };
const REQUEST_TIMEOUT_MS = 8000;

const EmployeeHome = () => {
  const { user } = useAuth();
  const [checkInTime, setCheckInTime] = useState(null);
  const [timer, setTimer] = useState("00:00:00");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [attendance, setAttendance] = useState(null);
  const [myTasksCount, setMyTasksCount] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState({ in: false, out: false });
  const [latestPayroll, setLatestPayroll] = useState(null);
  const [panelWarning, setPanelWarning] = useState("");
  const [networkGuard, setNetworkGuard] = useState({
    loading: true,
    authorized: false,
    officeName: "",
    message: "",
    error: "",
  });

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    getTodayAttendance();
    fetchPendingLeaves();
    fetchMyTasks();
    fetchPayroll();
    verifyNetworkStatus();
  }, []);

  useEffect(() => {
    if (!checkInTime || attendance?.checkOut) return;
    const iv = setInterval(() => {
      const diff = new Date() - new Date(checkInTime);
      setTimer(`${String(Math.floor(diff / 3600000)).padStart(2, "0")}:${String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0")}:${String(Math.floor((diff % 60000) / 1000)).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [checkInTime, attendance]);

  const getTodayAttendance = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/attendance/today`, { headers, timeout: REQUEST_TIMEOUT_MS });
      if (r.data.success && r.data.attendance) { setAttendance(r.data.attendance); setCheckInTime(r.data.attendance.checkIn); }
    } catch (e) {
      setPanelWarning("Some dashboard data is unavailable right now. Please refresh.");
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/leave/my-leaves`, { headers, timeout: REQUEST_TIMEOUT_MS });
      if (r.data.success) setPendingRequests(r.data.count);
    } catch (e) {
      setPanelWarning("Some dashboard data is unavailable right now. Please refresh.");
    }
  };

  const fetchMyTasks = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/task/my-tasks`, { headers, timeout: REQUEST_TIMEOUT_MS });
      if (r.data.success) setMyTasksCount({ total: r.data.tasks.length, completed: r.data.tasks.filter(t => t.status === "Completed").length });
    } catch (e) {
      setPanelWarning("Some dashboard data is unavailable right now. Please refresh.");
    }
  };

  const fetchPayroll = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/payroll/me`, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
        params: { month: getCurrentMonthValue() },
      });
      if (r.data.success) {
        setLatestPayroll(r.data.payrolls?.[0] || null);
      }
    } catch (e) {
      setPanelWarning("Some dashboard data is unavailable right now. Please refresh.");
    }
  };

  const verifyNetworkStatus = async () => {
    setNetworkGuard((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const r = await axios.get(`${API_BASE_URL}/api/attendance/network-status`, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      if (r.data?.success) {
        setNetworkGuard({
          loading: false,
          authorized: Boolean(r.data.authorized),
          officeName: r.data.officeName || "",
          message: r.data.message || "",
          error: "",
        });
        return r.data;
      }
      setNetworkGuard({
        loading: false,
        authorized: false,
        officeName: "",
        message: "",
        error: "Unable to validate your network. Please try again.",
      });
      return null;
    } catch (e) {
      setNetworkGuard({
        loading: false,
        authorized: false,
        officeName: "",
        message: "",
        error:
          e?.code === "ECONNABORTED"
            ? "Network verification timed out. Please try again."
            : e?.response?.data?.message || "Unable to validate your network. Please try again.",
      });
      return null;
    }
  };

  const showMsg = (text, type) => { setMessage({ text, type }); setTimeout(() => setMessage({ text: "", type: "" }), 3500); };

  const handleCheckIn = async () => {
    const status = await verifyNetworkStatus();
    if (!status?.authorized) {
      showMsg(
        "Unauthorized Network: Please connect to the Office WiFi to log your hours.",
        "error"
      );
      return;
    }

    setLoading((prev) => ({ ...prev, in: true }));
    try {
      const r = await axios.post(`${API_BASE_URL}/api/attendance/check-in`, {}, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      if (r.data.success) { showMsg("Checked in successfully!", "success"); setCheckInTime(r.data.attendance.checkIn); setAttendance(r.data.attendance); }
    } catch (e) { showMsg(e.response?.data?.message || "Already checked in today", "error"); }
    setLoading((prev) => ({ ...prev, in: false }));
  };

  const handleCheckOut = async () => {
    setLoading((prev) => ({ ...prev, out: true }));
    try {
      const r = await axios.post(`${API_BASE_URL}/api/attendance/check-out`, {}, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      if (r.data.success) { showMsg("Checked out successfully!", "success"); setAttendance(r.data.attendance); }
    } catch (e) { showMsg(e.response?.data?.message || "Please check in first", "error"); }
    setLoading((prev) => ({ ...prev, out: false }));
  };

  const isWorking = checkInTime && !attendance?.checkOut;
  const isCheckedOut = !!attendance?.checkOut;
  const taskProgress = myTasksCount.total > 0 ? (myTasksCount.completed / myTasksCount.total) * 100 : 0;
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  const card = { background: C.white, borderRadius: "12px", padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>{greet}, {user?.name?.split(" ")[0] || "there"} 👋</h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "3px" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      {/* Attendance Banner */}
      <div style={{
        ...card, marginBottom: "20px", padding: "20px 24px",
        background: isCheckedOut ? "#f0fdf4" : isWorking ? "#eff6ff" : C.white,
        borderColor: isCheckedOut ? "#bbf7d0" : isWorking ? "#bfdbfe" : C.border,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: isWorking ? "#dbeafe" : isCheckedOut ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={22} color={isWorking ? C.indigo : isCheckedOut ? C.green : C.muted} />
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "2px" }}>Today's Session</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: isWorking ? C.indigo : isCheckedOut ? C.green : C.sub, letterSpacing: "0.5px" }}>
              {isCheckedOut ? `${attendance.workHours?.toFixed(1)}h worked` : isWorking ? timer : "Not started"}
            </p>
            {checkInTime && <p style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>In: {new Date(checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{isCheckedOut ? ` · Out: ${new Date(attendance.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {!isWorking && !isCheckedOut && (
            <button
              onClick={handleCheckIn}
              disabled={loading.in || networkGuard.loading || !networkGuard.authorized}
              title={
                !networkGuard.authorized && !networkGuard.loading
                  ? "Unauthorized Network: Please connect to the Office WiFi to log your hours."
                  : "Check In"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "11px 20px",
                borderRadius: "9px",
                border: "none",
                background:
                  loading.in || networkGuard.loading || !networkGuard.authorized
                    ? "#cbd5e1"
                    : "linear-gradient(135deg,#059669,#34d399)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor:
                  loading.in || networkGuard.loading || !networkGuard.authorized
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  loading.in || networkGuard.loading || !networkGuard.authorized
                    ? "none"
                    : "0 4px 12px rgba(5,150,105,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              <LogIn size={15} /> {networkGuard.loading ? "Checking..." : loading.in ? "..." : "Check In"}
            </button>
          )}
          {isWorking && (
            <button onClick={handleCheckOut} disabled={loading.out} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 20px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#dc2626,#f87171)", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" }}>
              <LogOut size={15} /> {loading.out ? "…" : "Check Out"}
            </button>
          )}
          {isCheckedOut && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#dcfce7", borderRadius: "9px", border: "1px solid #bbf7d0" }}>
              <CheckCircle2 size={15} color={C.green} /><span style={{ color: C.green, fontWeight: 600, fontSize: "13px" }}>Day Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{ padding: "11px 16px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", fontWeight: 500, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? C.green : C.red }}>
          {message.text}
        </div>
      )}
      {panelWarning && (
        <div style={{ padding: "11px 16px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", fontWeight: 500, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
          {panelWarning}
        </div>
      )}

      {!isWorking && !isCheckedOut && (
        <div
          style={{
            ...card,
            marginBottom: "16px",
            padding: "14px 16px",
            borderColor: networkGuard.error || !networkGuard.authorized ? "#fecaca" : "#bfdbfe",
            background: networkGuard.error || !networkGuard.authorized ? "#fff7f7" : "#f8fbff",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "6px" }}>
            Network Verification
          </p>
          {networkGuard.loading ? (
            <p style={{ fontSize: "13px", color: C.sub, fontWeight: 500 }}>Checking office network...</p>
          ) : networkGuard.error ? (
            <p style={{ fontSize: "13px", color: C.red, fontWeight: 500 }}>{networkGuard.error}</p>
          ) : networkGuard.authorized ? (
            <p style={{ fontSize: "13px", color: C.indigo, fontWeight: 500 }}>
              Authorized network{networkGuard.officeName ? ` · ${networkGuard.officeName}` : ""}.
            </p>
          ) : (
            <p style={{ fontSize: "13px", color: C.red, fontWeight: 500 }}>
              Unauthorized Network: Please connect to the Office WiFi to log your hours.
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Today's Status", value: !attendance ? "Not Checked In" : isWorking ? "Working" : attendance.status, color: !attendance ? C.sub : isWorking ? C.indigo : attendance.status === "Present" ? C.green : C.red },
          { label: "Pending Leaves", value: pendingRequests, color: C.amber },
          { label: "Tasks Done", value: `${myTasksCount.completed}/${myTasksCount.total}`, color: C.indigo },
          { label: "This Month Pay", value: latestPayroll ? formatCurrency(latestPayroll.breakdown.netSalary) : "Pending", color: latestPayroll ? C.green : C.sub },
        ].map(({ label, value, color }) => (
          <div key={label} style={card}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>{label}</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Task Progress + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Task Progress</p>
            <TrendingUp size={15} color={C.indigo} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: C.sub }}>Completed</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: C.indigo }}>{taskProgress.toFixed(0)}%</span>
          </div>
          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${taskProgress}%`, background: "linear-gradient(90deg,#4f46e5,#6366f1)", borderRadius: "999px", transition: "width 0.5s ease" }} />
          </div>
          <p style={{ fontSize: "12px", color: C.muted, marginTop: "10px" }}>{myTasksCount.completed} of {myTasksCount.total} tasks done</p>
          <NavLink to="/employee-dashboard/tasks" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "12px", color: C.indigo, fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
            <ClipboardList size={13} /> View all tasks →
          </NavLink>
        </div>

        <div style={card}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "14px" }}>Quick Actions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { to: "/employee-dashboard/apply-for-leave", label: "Apply for Leave", color: C.amber, bg: "#fffbeb", border: "#fde68a" },
              { to: "/employee-dashboard/attendance", label: "View Attendance", color: C.green, bg: "#f0fdf4", border: "#bbf7d0" },
              { to: "/employee-dashboard/leave-request", label: "Leave History", color: C.indigo, bg: "#eef2ff", border: "#c7d2fe" },
              { to: "/employee-dashboard/payroll", label: "View Payslips", color: C.red, bg: "#fef2f2", border: "#fecaca" },
            ].map(({ to, label, color, bg, border }) => (
              <NavLink key={to} to={to} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "9px", textDecoration: "none", background: bg, border: `1px solid ${border}`, color, fontSize: "13px", fontWeight: 500, transition: "all 0.15s" }}>
                {label} <span>→</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHome;
