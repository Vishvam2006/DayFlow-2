import { createElement, useEffect, useMemo, useState } from "react";
import {
  Users, Warning, CheckCircle, TrendUp,
  FunnelSimple, Brain, Sparkle, X, ArrowsClockwise,
  Lightbulb, ShieldWarning, ChartLineUp, ClipboardText
} from "@phosphor-icons/react";
import {
  fetchAnalyticsEmployee,
  fetchAnalyticsList,
} from "../../services/analyticsService.js";

/* ─────────────────────────── constants ─────────────────────────── */
const RISK_COLORS = { High: "#dc2626", Medium: "#d97706", Low: "#059669" };
const RISK_BG = { High: "#fef2f2", Medium: "#fffbeb", Low: "#f0fdf4" };

const INSIGHT_FALLBACK = {
  summary: "Analysis pending",
  trend_analysis: "N/A",
  burnout_risk_indicator: "Low",
  issues: [],
  impact: "N/A",
  recommendations: [],
  manager_action_items: [],
};

const toRatio = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), 1);
};

const formatPercent = (value) => `${Math.round(toRatio(value) * 100)}%`;

const getRiskLevel = (level) => (
  Object.hasOwn(RISK_COLORS, level) ? level : "Low"
);

const normalizeInsight = (insight) => ({
  ...INSIGHT_FALLBACK,
  ...(insight && typeof insight === "object" ? insight : {}),
  trend_analysis:
    typeof insight?.trend_analysis === "string" ? insight.trend_analysis : INSIGHT_FALLBACK.trend_analysis,
  burnout_risk_indicator: getRiskLevel(insight?.burnout_risk_indicator),
  issues: Array.isArray(insight?.issues) ? insight.issues.filter(Boolean) : [],
  recommendations: Array.isArray(insight?.recommendations)
    ? insight.recommendations.filter(Boolean)
    : [],
  manager_action_items: Array.isArray(insight?.manager_action_items)
    ? insight.manager_action_items.filter(Boolean)
    : [],
});

const normalizeEmployee = (employee = {}) => {
  const riskScore = Number(employee.risk_score);
  const performanceScore = Number(employee.performance_score);
  const attendance = Number(employee?.metrics?.window?.attendanceRate);
  const productivityFromLegacy = Number(employee.productivity);
  const productivityFromPerformance = Number.isFinite(performanceScore)
    ? performanceScore / 100
    : 0;
  const productivity = Number.isFinite(productivityFromLegacy)
    ? toRatio(productivityFromLegacy)
    : toRatio(productivityFromPerformance);

  return {
    ...employee,
    _id: employee._id || employee.employeeId || employee.name,
    name: employee.name || "Unknown employee",
    employeeId: employee.employeeId || "N/A",
    productivity,
    leave_ratio: toRatio(employee.leave_ratio),
    attendance_score: Number.isFinite(attendance)
      ? toRatio(attendance)
      : toRatio(employee.attendance_score),
    risk_score: Number.isFinite(riskScore)
      ? Math.min(Math.max(Math.round(riskScore), 0), 100)
      : 0,
    performance_score: Number.isFinite(performanceScore)
      ? Math.min(Math.max(Math.round(performanceScore), 0), 100)
      : Math.round(productivity * 100),
    risk_level: getRiskLevel(employee.risk_level),
    insight: normalizeInsight(employee.insight),
  };
};

const getErrorMessage = (error) => {
  if (error?.name === "AbortError") return "Request was interrupted. Please try again.";
  if (typeof error?.message === "string" && error.message.trim()) return error.message.trim();
  return "Unable to load AI analytics right now. Please retry.";
};

function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timerId);
  }, [value, delayMs]);

  return debounced;
}

/* ─────────────────────────── components ─────────────────────────── */

// 1. Employee Detail Modal (The "Drawer")
function EmployeeDetailModal({ employee, onClose, loading, error }) {
  if (!employee) return null;

  const riskLevel = getRiskLevel(employee.risk_level);
  const insight = normalizeInsight(employee.insight);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{employee.name}</h2>
            <p className="text-slate-500 text-sm">Case Analysis • {riskLevel} Risk</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} weight="bold" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Risk Score</p>
              <p className="text-2xl font-black" style={{ color: RISK_COLORS[riskLevel] }}>{employee.risk_score}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Performance</p>
              <p className="text-2xl font-black text-slate-700">{employee.performance_score}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Attendance</p>
              <p className="text-2xl font-black text-slate-700">{formatPercent(employee.attendance_score)}</p>
            </div>
          </div>

          {loading && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Loading latest employee insight...
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* AI Executive Summary */}
          <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
            <Sparkle size={40} weight="fill" className="absolute -right-4 -top-4 text-indigo-100/50 rotate-12" />
            <h3 className="flex items-center gap-2 text-indigo-900 font-bold mb-3">
              <Brain size={20} weight="fill" />
              AI Executive Insight
            </h3>
            <p className="text-indigo-800/80 leading-relaxed italic">
              "{insight.summary || "No automated summary available for this profile."}"
            </p>
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Trend Analysis</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {insight.trend_analysis || "Trend analysis unavailable."}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Burnout Indicator</h3>
              <RiskBadge level={insight.burnout_risk_indicator} />
            </div>
          </section>

          {/* Issues and Risk Factors */}
          <section>
            <h3 className="flex items-center gap-2 text-slate-800 font-bold mb-4">
              <ShieldWarning size={20} weight="bold" className="text-red-500" />
              Identified Risk Factors
            </h3>
            <div className="space-y-3">
              {insight.issues.length > 0 ? insight.issues.map((issue, i) => (
                <div key={i} className="flex gap-3 p-3 bg-red-50/30 border border-red-100 rounded-lg text-sm text-red-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {issue}
                </div>
              )) : <p className="text-slate-500 text-sm">No critical issues detected.</p>}
            </div>
          </section>

          {/* Business Impact */}
          <section>
            <h3 className="flex items-center gap-2 text-slate-800 font-bold mb-2 text-sm uppercase tracking-wider">
              <ChartLineUp size={18} /> Business Impact
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg">
              {insight.impact || "Standard operational impact based on current metrics."}
            </p>
          </section>

          {/* Solutions / Recommendations */}
          <section>
            <h3 className="flex items-center gap-2 text-slate-800 font-bold mb-4">
              <Lightbulb size={20} weight="fill" className="text-amber-500" />
              Recommended Solutions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {insight.recommendations.length > 0 ? insight.recommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle size={20} weight="fill" className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">{rec}</span>
                </div>
              )) : <p className="text-slate-500 text-sm">No specific recommendations provided.</p>}
            </div>
          </section>
          <section>
            <h3 className="flex items-center gap-2 text-slate-800 font-bold mb-4">
              <ClipboardText size={20} weight="duotone" className="text-blue-600" />
              Manager Action Items
            </h3>
            <div className="space-y-2">
              {insight.manager_action_items.length > 0 ? insight.manager_action_items.map((item, i) => (
                <div key={i} className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  {item}
                </div>
              )) : <p className="text-slate-500 text-sm">No manager actions suggested yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const riskLevel = getRiskLevel(level);

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight"
      style={{ color: RISK_COLORS[riskLevel], backgroundColor: RISK_BG[riskLevel] }}
    >
      {riskLevel}
    </span>
  );
}

function StatCard({ title, value, icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-3xl font-black text-slate-800">{value}</p>
          {sub && <p className="text-[11px] text-slate-500 mt-2 font-medium">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          {icon ? createElement(icon, { size: 24, color, weight: "fill" }) : null}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main dashboard ─────────────────────── */

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const token = localStorage.getItem("token");
  const windowDays = 30;
  const baselineDays = 90;
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);
    fetchAnalyticsList({
      token,
      windowDays,
      baselineDays,
    })
      .then((rows) => {
        if (!isCurrent) return;
        setData(Array.isArray(rows) ? rows.map(normalizeEmployee) : []);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isCurrent) return;
        setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [token, refreshKey]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    let isCurrent = true;
    setDetailLoading(true);
    setDetailError(null);

    fetchAnalyticsEmployee({
      token,
      employeeId: selectedEmployeeId,
      windowDays,
      baselineDays,
    })
      .then((payload) => {
        if (!isCurrent) return;
        setSelectedEmployee(normalizeEmployee(payload));
      })
      .catch((err) => {
        if (!isCurrent) return;
        setDetailError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isCurrent) return;
        setDetailLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedEmployeeId, token]);

  const summary = useMemo(() => ({
    total: data.length,
    high: data.filter(e => e.risk_level === "High").length,
    medium: data.filter(e => e.risk_level === "Medium").length,
    low: data.filter(e => e.risk_level === "Low").length,
  }), [data]);

  const filtered = useMemo(() => {
    const normalizedTerm = debouncedSearch.trim().toLowerCase().slice(0, 80);
    if (!normalizedTerm) return data;
    return data.filter((e) =>
      String(e.name || "").toLowerCase().includes(normalizedTerm)
    );
  }, [data, debouncedSearch]);

  const openEmployee = (employee) => {
    setSelectedEmployee(normalizeEmployee(employee));
    setSelectedEmployeeId(employee?._id);
  };

  const closeEmployeeDrawer = () => {
    setSelectedEmployee(null);
    setSelectedEmployeeId(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-medium text-slate-400">Analyzing Workforce Data...</div>;

  if (error) {
    return (
      <div className="p-10 text-center font-medium text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6 bg-slate-50 min-h-screen">
      
      {/* Drawer Overlay */}
      {selectedEmployee && (
        <EmployeeDetailModal 
          employee={selectedEmployee} 
          onClose={closeEmployeeDrawer}
          loading={detailLoading}
          error={detailError}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Brain size={36} weight="fill" className="text-indigo-600" />
            Talent Intelligence
          </h1>
          <p className="text-slate-500 font-medium">Predictive Burnout & Engagement Analytics</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold"
          >
            <ArrowsClockwise weight="bold" />
            Refresh
          </button>
          <div className="flex gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold items-center">
            <Sparkle weight="fill" />
            POWERED BY GROQ AI
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Staff" value={summary.total} icon={Users} color="#6366f1" sub="Monitored profiles" />
        <StatCard title="Critical Risk" value={summary.high} icon={Warning} color="#ef4444" sub="Immediate attention needed" />
        <StatCard title="Elevated Risk" value={summary.medium} icon={TrendUp} color="#f59e0b" sub="Trending upward" />
        <StatCard title="Stable" value={summary.low} icon={CheckCircle} color="#10b981" sub="High engagement" />
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Workforce Risk Assessment</h3>
          <div className="relative">
            <FunnelSimple className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-indigo-500 transition-all w-64"
              placeholder="Filter by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={80}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Quick Insight</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 font-medium">
                    No employee analytics available.
                  </td>
                </tr>
              )}
              {filtered.map(emp => (
                <tr key={emp._id || emp.employeeId || emp.name} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openEmployee(emp)}>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-700">{emp.name}</p>
                    <p className="text-xs text-slate-400">ID: {emp.employeeId}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${emp.performance_score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{emp.performance_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600 text-sm">
                    {formatPercent(emp.attendance_score)}
                  </td>
                  <td className="px-6 py-5">
                    <RiskBadge level={emp.risk_level} />
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-500 max-w-[200px] truncate">{emp.insight?.summary}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-indigo-600 font-bold text-xs bg-indigo-50 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      VIEW REPORT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
