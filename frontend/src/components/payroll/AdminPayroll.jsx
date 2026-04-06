import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Calculator,
  Eye,
  RefreshCw,
  Save,
  Settings2,
  Wallet,
  X,
} from "lucide-react";
import API_BASE_URL from "../../config/api.js";
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthValue,
  getGrossFromStructure,
} from "../../utils/payroll.js";

const C = {
  text: "#0f172a",
  sub: "#475569",
  muted: "#94a3b8",
  border: "#e2e8f0",
  indigo: "#4f46e5",
  green: "#059669",
  red: "#dc2626",
  amber: "#d97706",
  card: "#fff",
};

const defaultSalaryForm = {
  basicSalary: 0,
  hra: 0,
  allowances: 0,
  bonus: 0,
  taxDeduction: 0,
  pfDeduction: 0,
};

const salaryFields = [
  { key: "basicSalary", label: "Basic Salary" },
  { key: "hra", label: "HRA" },
  { key: "allowances", label: "Allowances" },
  { key: "bonus", label: "Bonus" },
  { key: "taxDeduction", label: "Tax" },
  { key: "pfDeduction", label: "PF" },
];

const cardStyle = {
  background: C.card,
  borderRadius: "14px",
  border: `1px solid ${C.border}`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const PayslipModal = ({ payroll, onClose }) => {
  if (!payroll) {
    return null;
  }

  const earningRows = [
    ["Basic Salary", payroll.salaryStructure.basicSalary],
    ["HRA", payroll.salaryStructure.hra],
    ["Allowances", payroll.salaryStructure.allowances],
    ["Bonus", payroll.breakdown.bonus],
  ];

  const deductionRows = [
    ["Leave Deduction", payroll.breakdown.leaveDeduction],
    ["Tax", payroll.breakdown.taxDeduction],
    ["PF", payroll.breakdown.pfDeduction],
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: "20px",
      }}
    >
      <div
        style={{
          ...cardStyle,
          width: "100%",
          maxWidth: "760px",
          maxHeight: "88vh",
          overflowY: "auto",
          padding: "26px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.text }}>
              {payroll.employeeSnapshot.name}
            </h2>
            <p style={{ fontSize: "13px", color: C.sub, marginTop: "4px" }}>
              Payslip for {formatMonthLabel(payroll.month, payroll.monthLabel)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={16} color={C.sub} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          {[
            {
              label: "Net Salary",
              value: formatCurrency(payroll.breakdown.netSalary),
              color: C.green,
              bg: "#f0fdf4",
            },
            {
              label: "Gross Earnings",
              value: formatCurrency(payroll.breakdown.totalEarnings),
              color: C.indigo,
              bg: "#eef2ff",
            },
            {
              label: "Total Deductions",
              value: formatCurrency(payroll.breakdown.totalDeductions),
              color: C.red,
              bg: "#fef2f2",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: "18px",
                background: item.bg,
                borderColor: `${item.color}30`,
              }}
            >
              <p style={{ fontSize: "11px", color: C.muted, fontWeight: 600 }}>
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "24px",
                  color: item.color,
                  fontWeight: 700,
                  marginTop: "8px",
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: "18px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "14px" }}>
              Earnings Breakdown
            </p>
            {earningRows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <span style={{ fontSize: "13px", color: C.sub }}>{label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle, padding: "18px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "14px" }}>
              Deductions & Attendance
            </p>
            {deductionRows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <span style={{ fontSize: "13px", color: C.sub }}>{label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            {[
              ["Working Days", payroll.attendanceSummary.workingDays],
              ["Present Days", payroll.attendanceSummary.presentDays],
              ["Half Days", payroll.attendanceSummary.halfDays],
              ["Paid Leave Days", payroll.attendanceSummary.paidLeaveDays],
              ["Unpaid Leave Days", payroll.attendanceSummary.unpaidLeaveDays],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <span style={{ fontSize: "13px", color: C.sub }}>{label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StructureModal = ({
  employee,
  form,
  saving,
  onChange,
  onClose,
  onSave,
}) => {
  if (!employee) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: "20px",
      }}
    >
      <div
        style={{
          ...cardStyle,
          width: "100%",
          maxWidth: "620px",
          padding: "26px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>
              Salary Structure
            </h2>
            <p style={{ fontSize: "13px", color: C.sub, marginTop: "4px" }}>
              {employee.name} · {employee.employeeId || employee.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={16} color={C.sub} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          {salaryFields.map((field) => (
            <div key={field.key}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: C.sub,
                  marginBottom: "6px",
                }}
              >
                {field.label}
              </label>
              <input
                type="number"
                min="0"
                value={form[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${C.border}`,
                  background: "#f8fafc",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            background: "#eef2ff",
            color: C.indigo,
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          Current gross salary: {formatCurrency(getGrossFromStructure(form))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              background: "#fff",
              color: C.sub,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "#fff",
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Structure"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPayroll = () => {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryForm, setSalaryForm] = useState(defaultSalaryForm);
  const [savingStructure, setSavingStructure] = useState(false);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    []
  );

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeeResponse, payrollResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/employee/get`, { headers }),
        axios.get(`${API_BASE_URL}/api/payroll`, {
          headers,
          params: { month },
        }),
      ]);

      setEmployees(employeeResponse.data.employees || []);
      setPayrolls(payrollResponse.data.payrolls || []);
    } catch (error) {
      showMessage("error", error.response?.data?.error || "Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const payrollByEmployee = useMemo(
    () => new Map(payrolls.map((payroll) => [String(payroll.employee), payroll])),
    [payrolls]
  );

  const summary = useMemo(() => {
    const configuredEmployees = employees.filter(
      (employee) => getGrossFromStructure(employee.salaryStructure) > 0
    ).length;
    const totalNetPayout = payrolls.reduce(
      (sum, payroll) => sum + (payroll.breakdown?.netSalary || 0),
      0
    );

    return {
      employees: employees.length,
      configuredEmployees,
      generatedPayrolls: payrolls.length,
      totalNetPayout,
    };
  }, [employees, payrolls]);

  const openStructureEditor = (employee) => {
    setSelectedEmployee(employee);
    setSalaryForm({
      ...defaultSalaryForm,
      ...(employee.salaryStructure || {}),
    });
  };

  const saveSalaryStructure = async () => {
    if (!selectedEmployee) {
      return;
    }

    setSavingStructure(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/payroll/structure/${selectedEmployee._id}`,
        salaryForm,
        { headers }
      );
      showMessage("success", "Salary structure saved successfully.");
      setSelectedEmployee(null);
      fetchData();
    } catch (error) {
      showMessage("error", error.response?.data?.error || "Unable to save salary structure.");
    } finally {
      setSavingStructure(false);
    }
  };

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/payroll/generate`,
        { month },
        { headers }
      );
      showMessage(
        "success",
        `Payroll generated for ${response.data.generatedCount} employees.`
      );
      fetchData();
    } catch (error) {
      showMessage("error", error.response?.data?.error || "Payroll generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <PayslipModal payroll={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      <StructureModal
        employee={selectedEmployee}
        form={salaryForm}
        saving={savingStructure}
        onChange={(key, value) => setSalaryForm((prev) => ({ ...prev, [key]: value }))}
        onClose={() => setSelectedEmployee(null)}
        onSave={saveSalaryStructure}
      />

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text }}>
          Payroll Management
        </h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "4px" }}>
          Generate monthly payroll, manage salary structures, and review payslips.
        </p>
      </div>

      {message.text ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: message.type === "success" ? C.green : C.red,
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {message.text}
        </div>
      ) : null}

      <div
        style={{
          ...cardStyle,
          padding: "18px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Wallet size={18} color={C.indigo} />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
              Payroll Month
            </p>
            <p style={{ fontSize: "12px", color: C.sub }}>{formatMonthLabel(month)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              background: "#fff",
            }}
          />
          <button
            onClick={fetchData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={generatePayroll}
            disabled={generating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "#fff",
              cursor: "pointer",
              opacity: generating ? 0.7 : 1,
            }}
          >
            <Calculator size={14} />
            {generating ? "Generating..." : "Generate Payroll"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Employees", value: summary.employees, color: C.indigo, bg: "#eef2ff" },
          {
            label: "Configured Salaries",
            value: summary.configuredEmployees,
            color: C.green,
            bg: "#f0fdf4",
          },
          {
            label: "Generated Payrolls",
            value: summary.generatedPayrolls,
            color: C.amber,
            bg: "#fffbeb",
          },
          {
            label: "Net Payout",
            value: formatCurrency(summary.totalNetPayout),
            color: C.red,
            bg: "#fef2f2",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              ...cardStyle,
              padding: "18px",
              background: item.bg,
              borderColor: `${item.color}30`,
            }}
          >
            <p style={{ fontSize: "11px", color: C.muted, fontWeight: 600 }}>{item.label}</p>
            <p style={{ fontSize: "22px", color: item.color, fontWeight: 700, marginTop: "8px" }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: `1px solid ${C.border}` }}>
              {["Employee", "Gross", "Deductions", "Net", "Status", "Actions"].map((label) => (
                <th
                  key={label}
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    fontSize: "11px",
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.7px",
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: C.muted }}>
                  Loading payroll data...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: C.muted }}>
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const payroll = payrollByEmployee.get(String(employee._id)) || null;
                const gross = payroll
                  ? payroll.breakdown.totalEarnings
                  : getGrossFromStructure(employee.salaryStructure);
                const deductions = payroll ? payroll.breakdown.totalDeductions : 0;
                const net = payroll ? payroll.breakdown.netSalary : 0;

                return (
                  <tr key={employee._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "16px 18px" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>{employee.name}</p>
                        <p style={{ fontSize: "12px", color: C.sub, marginTop: "4px" }}>
                          {employee.employeeId || employee.email}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px", color: C.text, fontSize: "13px" }}>
                      {formatCurrency(gross)}
                    </td>
                    <td style={{ padding: "16px 18px", color: C.sub, fontSize: "13px" }}>
                      {formatCurrency(deductions)}
                    </td>
                    <td style={{ padding: "16px 18px", color: C.green, fontWeight: 700, fontSize: "13px" }}>
                      {payroll ? formatCurrency(net) : "—"}
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: payroll ? "#f0fdf4" : "#fffbeb",
                          color: payroll ? C.green : C.amber,
                          border: `1px solid ${payroll ? "#bbf7d0" : "#fde68a"}`,
                        }}
                      >
                        {payroll ? "Generated" : "Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => openStructureEditor(employee)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 10px",
                            borderRadius: "9px",
                            border: `1px solid ${C.border}`,
                            background: "#fff",
                            color: C.sub,
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <Settings2 size={13} />
                          Salary
                        </button>
                        {payroll ? (
                          <button
                            onClick={() => setSelectedPayslip(payroll)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 10px",
                              borderRadius: "9px",
                              border: "none",
                              background: "#eef2ff",
                              color: C.indigo,
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            <Eye size={13} />
                            Payslip
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayroll;
