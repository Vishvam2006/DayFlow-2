import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Users, Warning, CheckCircle, TrendUp, ArrowUp, ArrowDown,
  FunnelSimple, SortAscending, Brain, Sparkle,
} from "@phosphor-icons/react";
import API_BASE_URL from "../../config/api.js";

/* ─────────────────────────── constants ─────────────────────────── */

const RISK_COLORS = { High: "#dc2626", Medium: "#d97706", Low: "#059669" };
const RISK_BG     = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" };
const PIE_COLORS  = ["#dc2626", "#d97706", "#059669"];

const DEPARTMENTS = ["All Departments"];

/* ─────────────────────────── small helpers ─────────────────────── */

function RiskBadge({ level }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: RISK_COLORS[level], backgroundColor: RISK_BG[level] }}
    >
      {level === "High" && <Warning size={10} weight="fill" />}
      {level === "Medium" && <TrendUp size={10} weight="fill" />}
      {level === "Low" && <CheckCircle size={10} weight="fill" />}
      {level}
    </span>
  );
}

function StatCard({ title, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] p-5 border border-[var(--color-border)] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-default">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">{value}</p>
          {sub && <p className="text-xs text-[var(--color-text-muted)] mt-1.5">{sub}</p>}
        </div>
        <div className="w-[42px] h-[42px] rounded-[var(--radius-sm)] flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon size={20} color={color} weight="fill" />
        </div>
      </div>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg px-3 py-2 text-[12px]">
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">{label}</p>
      <p style={{ color: RISK_COLORS[payload[0]?.payload?.risk_level] }}>
        Risk Score: <strong>{payload[0]?.value}</strong>
      </p>
      <p className="text-[var(--color-text-secondary)]">Level: {payload[0]?.payload?.risk_level}</p>
    </div>
  );
}

function PieTooltipCustom({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg px-3 py-2 text-[12px]">
      <p style={{ color: RISK_COLORS[payload[0]?.name] }} className="font-semibold">{payload[0]?.name} Risk</p>
      <p className="text-[var(--color-text-secondary)]">{payload[0]?.value} employees</p>
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────── */

const AnalyticsDashboard = () => {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sortKey, setSortKey]   = useState("risk_score");
  const [sortDir, setSortDir]   = useState("desc");
  const [search, setSearch]     = useState("");

  /* ── fetch ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_BASE_URL}/api/analytics`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async res => {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(`Server returned non-JSON response (${res.status})`);
        }
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Unexpected API response format");
        return json;
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  /* ── derived data ── */
  const summary = useMemo(() => ({
    total:  data.length,
    high:   data.filter(e => e.risk_level === "High").length,
    medium: data.filter(e => e.risk_level === "Medium").length,
    low:    data.filter(e => e.risk_level === "Low").length,
  }), [data]);

  const pieData = useMemo(() => [
    { name: "High",   value: summary.high },
    { name: "Medium", value: summary.medium },
    { name: "Low",    value: summary.low },
  ].filter(d => d.value > 0), [summary]);

  const topRisk = useMemo(() =>
    [...data].sort((a, b) => b.risk_score - a.risk_score).slice(0, 3),
  [data]);

  /* attendance trend mock — show each employee's attendance as a data point */
  const attendanceTrend = useMemo(() =>
    data.slice(0, 8).map(e => ({
      name: e.name.split(" ")[0],
      attendance: Math.round(e.attendance_score * 100),
      productivity: Math.round(e.productivity * 100),
    })),
  [data]);

  /* filtered + sorted table */
  const filtered = useMemo(() => {
    let rows = [...data];
    if (search.trim()) {
      rows = rows.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    }
    rows.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return rows;
  }, [data, sortKey, sortDir, search]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <SortAscending size={12} className="text-[var(--color-text-muted)]" />;
    return sortDir === "asc"
      ? <ArrowUp size={12} className="text-[var(--color-text-primary)]" />
      : <ArrowDown size={12} className="text-[var(--color-text-primary)]" />;
  }

  /* ── loading / error states ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
      <p className="text-[var(--color-text-secondary)] text-sm">Loading analytics…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Warning size={40} className="text-[var(--color-danger)]" weight="fill" />
      <p className="text-[var(--color-text-primary)] font-semibold">Failed to load analytics</p>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md text-center">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-[var(--radius-sm)] hover:bg-slate-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Users size={40} className="text-[var(--color-text-muted)]" weight="fill" />
      <p className="text-[var(--color-text-primary)] font-semibold">No employee data found</p>
      <p className="text-sm text-[var(--color-text-secondary)]">Add employees and their task/leave data to see analytics.</p>
    </div>
  );

  /* ─────────────────────────── render ─────────────────────────── */
  return (
    <div className="max-w-[1400px] mx-auto pb-10">

      {/* ── Header ── */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <Brain size={26} weight="fill" className="text-indigo-600" />
            Predictive Analytics
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            AI-powered burnout &amp; attrition risk assessment
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5">
          <Sparkle size={13} weight="fill" />
          Insights by Gemini AI
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value={summary.total} icon={Users}        color="#0f172a" sub="Active workforce" />
        <StatCard title="High Risk"        value={summary.high} icon={Warning}       color="#dc2626" sub="Immediate attention" />
        <StatCard title="Medium Risk"      value={summary.medium} icon={TrendUp}     color="#d97706" sub="Monitor closely" />
        <StatCard title="Low Risk"         value={summary.low} icon={CheckCircle}    color="#059669" sub="Healthy & stable" />
      </div>

      {/* ── Top Risk Employees ── */}
      {topRisk.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-sm p-5 mb-6">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-1.5">
            <Warning size={15} weight="fill" className="text-[var(--color-danger)]" />
            Top Risk Employees
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {topRisk.map((emp, i) => (
              <div key={emp.name}
                className="flex-1 rounded-[var(--radius-sm)] border p-3"
                style={{ borderColor: `${RISK_COLORS[emp.risk_level]}30`, backgroundColor: RISK_BG[emp.risk_level] }}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{emp.name}</p>
                  <RiskBadge level={emp.risk_level} />
                </div>
                <p className="text-[22px] font-bold" style={{ color: RISK_COLORS[emp.risk_level] }}>{emp.risk_score}<span className="text-[11px] font-medium ml-0.5">/100</span></p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-snug line-clamp-2">{emp.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-sm p-5">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">Employee Risk Scores</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                tickFormatter={n => n.split(" ")[0]} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="risk_score" radius={[3, 3, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={RISK_COLORS[entry.risk_level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-sm p-5">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">Risk Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltipCustom />} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Attendance & Productivity Trend ── */}
      <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-sm p-5 mb-6">
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-4">
          Attendance vs Productivity (%) — Per Employee
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={attendanceTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: "4px",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-md)",
              }}
            />
            <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            <Line type="monotone" dataKey="attendance"   stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Attendance %" />
            <Line type="monotone" dataKey="productivity" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="Productivity %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Employee Table ── */}
      <div className="bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            Employee Risk Details
            <span className="ml-2 text-[11px] font-normal text-[var(--color-text-muted)]">({filtered.length} records)</span>
          </p>
          <div className="flex items-center gap-2">
            <FunnelSimple size={14} className="text-[var(--color-text-muted)] shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="text-[12px] px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-slate-400 w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-[var(--color-page)] border-b border-[var(--color-border)]">
              <tr>
                {[
                  { label: "#",              key: null },
                  { label: "Name",           key: "name" },
                  { label: "Productivity",   key: "productivity" },
                  { label: "Leave Ratio",    key: "leave_ratio" },
                  { label: "Attendance",     key: "attendance_score" },
                  { label: "Risk Score",     key: "risk_score" },
                  { label: "Risk Level",     key: "risk_level" },
                  { label: "AI Insight",     key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    onClick={key ? () => toggleSort(key) : undefined}
                    className={`px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap select-none
                      ${key ? "cursor-pointer hover:text-[var(--color-text-primary)]" : ""}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[var(--color-text-muted)] text-[13px]">
                    No employees match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((emp, i) => (
                  <tr key={emp.name} className="hover:bg-[var(--color-page)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)] whitespace-nowrap">{emp.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(emp.productivity * 100, 100)}%`,
                              backgroundColor: emp.productivity >= 0.6 ? "#059669" : emp.productivity >= 0.4 ? "#d97706" : "#dc2626",
                            }}
                          />
                        </div>
                        <span>{(emp.productivity * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{(emp.leave_ratio * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(emp.attendance_score * 100, 100)}%`,
                              backgroundColor: emp.attendance_score >= 0.85 ? "#059669" : emp.attendance_score >= 0.7 ? "#d97706" : "#dc2626",
                            }}
                          />
                        </div>
                        <span>{(emp.attendance_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-bold text-[15px]"
                        style={{ color: RISK_COLORS[emp.risk_level] }}
                      >
                        {emp.risk_score}
                      </span>
                      <span className="text-[var(--color-text-muted)] text-[10px] ml-0.5">/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={emp.risk_level} />
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <div className="flex items-start gap-1.5">
                        <Sparkle size={11} weight="fill" className="text-indigo-400 mt-0.5 shrink-0" />
                        <span className="text-[var(--color-text-secondary)] leading-snug line-clamp-2">{emp.insight}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;