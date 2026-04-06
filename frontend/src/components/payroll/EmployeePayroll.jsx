import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Download, Eye, FileText, RefreshCw, Wallet, X } from "lucide-react";
import API_BASE_URL from "../../config/api.js";
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthValue,
} from "../../utils/payroll.js";

const C = {
  text: "#0f172a",
  sub: "#475569",
  muted: "#94a3b8",
  border: "#e2e8f0",
  indigo: "#4f46e5",
  green: "#059669",
  red: "#dc2626",
  card: "#fff",
};

const cardStyle = {
  background: C.card,
  borderRadius: "14px",
  border: `1px solid ${C.border}`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const buildPrintMarkup = (payroll) => `
<!doctype html>
<html>
  <head>
    <title>Payslip ${payroll.month}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
      .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
      h1, h2 { margin: 0; }
      p { margin: 4px 0; color: #475569; }
    </style>
  </head>
  <body>
    <h1>DayFlow Payslip</h1>
    <p>${payroll.employeeSnapshot.name} · ${formatMonthLabel(payroll.month, payroll.monthLabel)}</p>
    <p>${payroll.employeeSnapshot.employeeId || payroll.employeeSnapshot.email}</p>
    <div class="box">
      <h2>Earnings</h2>
      <div class="row"><span>Basic Salary</span><strong>${formatCurrency(payroll.salaryStructure.basicSalary)}</strong></div>
      <div class="row"><span>HRA</span><strong>${formatCurrency(payroll.salaryStructure.hra)}</strong></div>
      <div class="row"><span>Allowances</span><strong>${formatCurrency(payroll.salaryStructure.allowances)}</strong></div>
      <div class="row"><span>Bonus</span><strong>${formatCurrency(payroll.breakdown.bonus)}</strong></div>
      <div class="row"><span>Total Earnings</span><strong>${formatCurrency(payroll.breakdown.totalEarnings)}</strong></div>
    </div>
    <div class="box">
      <h2>Deductions</h2>
      <div class="row"><span>Leave Deduction</span><strong>${formatCurrency(payroll.breakdown.leaveDeduction)}</strong></div>
      <div class="row"><span>Tax</span><strong>${formatCurrency(payroll.breakdown.taxDeduction)}</strong></div>
      <div class="row"><span>PF</span><strong>${formatCurrency(payroll.breakdown.pfDeduction)}</strong></div>
      <div class="row"><span>Total Deductions</span><strong>${formatCurrency(payroll.breakdown.totalDeductions)}</strong></div>
      <div class="row"><span>Net Salary</span><strong>${formatCurrency(payroll.breakdown.netSalary)}</strong></div>
    </div>
  </body>
</html>
`;

const PayslipModal = ({ payroll, onClose, onDownload }) => {
  if (!payroll) {
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
          maxWidth: "720px",
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
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.text }}>
              {formatMonthLabel(payroll.month, payroll.monthLabel)}
            </h2>
            <p style={{ fontSize: "13px", color: C.sub, marginTop: "4px" }}>
              {payroll.employeeSnapshot.name} · {payroll.employeeSnapshot.employeeId || payroll.employeeSnapshot.email}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => onDownload(payroll)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 12px",
                borderRadius: "10px",
                border: "none",
                background: "#eef2ff",
                color: C.indigo,
                cursor: "pointer",
              }}
            >
              <Download size={14} />
              Download
            </button>
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
            {
              label: "Net Salary",
              value: formatCurrency(payroll.breakdown.netSalary),
              color: C.green,
              bg: "#f0fdf4",
            },
            {
              label: "Total Earnings",
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
          ].map((card) => (
            <div
              key={card.label}
              style={{
                ...cardStyle,
                padding: "18px",
                background: card.bg,
                borderColor: `${card.color}30`,
              }}
            >
              <p style={{ fontSize: "11px", color: C.muted, fontWeight: 600 }}>{card.label}</p>
              <p style={{ fontSize: "22px", color: card.color, fontWeight: 700, marginTop: "8px" }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: "18px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "14px" }}>
              Earnings
            </p>
            {[
              ["Basic Salary", payroll.salaryStructure.basicSalary],
              ["HRA", payroll.salaryStructure.hra],
              ["Allowances", payroll.salaryStructure.allowances],
              ["Bonus", payroll.breakdown.bonus],
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
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle, padding: "18px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "14px" }}>
              Deductions & Attendance
            </p>
            {[
              ["Leave Deduction", formatCurrency(payroll.breakdown.leaveDeduction)],
              ["Tax", formatCurrency(payroll.breakdown.taxDeduction)],
              ["PF", formatCurrency(payroll.breakdown.pfDeduction)],
              ["Working Days", payroll.attendanceSummary.workingDays],
              ["Present Days", payroll.attendanceSummary.presentDays],
              ["Paid Leave Days", payroll.attendanceSummary.paidLeaveDays],
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

const EmployeePayroll = () => {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    []
  );

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payroll/me`, {
        headers,
        params: { month },
      });
      setPayrolls(response.data.payrolls || []);
    } catch (error) {
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month]);

  const latestPayroll = payrolls[0] || null;

  const handleDownload = (payroll) => {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      return;
    }
    popup.document.write(buildPrintMarkup(payroll));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <PayslipModal
        payroll={selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        onDownload={handleDownload}
      />

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text }}>
          My Payslips
        </h1>
        <p style={{ color: C.sub, fontSize: "13px", marginTop: "4px" }}>
          Review your monthly payroll and download printable payslips.
        </p>
      </div>

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
              Selected Month
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
            onClick={fetchPayrolls}
            style={{
              display: "inline-flex",
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
          { label: "Available Payslips", value: payrolls.length, color: C.indigo, bg: "#eef2ff" },
          {
            label: "Latest Net Salary",
            value: latestPayroll ? formatCurrency(latestPayroll.breakdown.netSalary) : "—",
            color: C.green,
            bg: "#f0fdf4",
          },
          {
            label: "Latest Deductions",
            value: latestPayroll ? formatCurrency(latestPayroll.breakdown.totalDeductions) : "—",
            color: C.red,
            bg: "#fef2f2",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              ...cardStyle,
              padding: "18px",
              background: card.bg,
              borderColor: `${card.color}30`,
            }}
          >
            <p style={{ fontSize: "11px", color: C.muted, fontWeight: 600 }}>{card.label}</p>
            <p style={{ fontSize: "22px", color: card.color, fontWeight: 700, marginTop: "8px" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: `1px solid ${C.border}` }}>
              {["Month", "Earnings", "Deductions", "Net Salary", "Actions"].map((label) => (
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
                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: C.muted }}>
                  Loading payslips...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "44px", textAlign: "center", color: C.muted }}>
                  <FileText size={32} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
                  No payroll has been generated for this month yet.
                </td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "16px 18px", color: C.text, fontWeight: 600 }}>
                    {formatMonthLabel(payroll.month, payroll.monthLabel)}
                  </td>
                  <td style={{ padding: "16px 18px", color: C.sub, fontSize: "13px" }}>
                    {formatCurrency(payroll.breakdown.totalEarnings)}
                  </td>
                  <td style={{ padding: "16px 18px", color: C.sub, fontSize: "13px" }}>
                    {formatCurrency(payroll.breakdown.totalDeductions)}
                  </td>
                  <td style={{ padding: "16px 18px", color: C.green, fontSize: "13px", fontWeight: 700 }}>
                    {formatCurrency(payroll.breakdown.netSalary)}
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setSelectedPayroll(payroll)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 10px",
                          borderRadius: "9px",
                          border: `1px solid ${C.border}`,
                          background: "#fff",
                          cursor: "pointer",
                          color: C.sub,
                        }}
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(payroll)}
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
                          fontWeight: 600,
                        }}
                      >
                        <Download size={13} />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePayroll;
