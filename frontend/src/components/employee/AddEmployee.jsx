import React, { useState } from "react";
import {
  UserPlus,
  Mail,
  Briefcase,
  Building2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import API_BASE_URL from "../../config/api.js";
import { formatCurrency, getGrossFromStructure } from "../../utils/payroll.js";

/* ── tiny helpers ─────────────────────────────────────────── */
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "9px",
  border: "1.5px solid #e2e8f0",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  background: "#fff",
  boxSizing: "border-box",
  transition: "border 0.15s",
};
const labelStyle = {
  display: "block",
  fontSize: "12.5px",
  fontWeight: 600,
  color: "#475569",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

/* ── Credentials Modal ───────────────────────────────────── */
const CredentialsModal = ({ credentials, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const copy = async (text, setCopied) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          padding: "36px 32px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "8px",
            width: "30px",
            height: "30px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={15} color="#64748b" />
        </button>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "13px",
              background: "linear-gradient(135deg,#4f46e5,#10b981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Employee Created!
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              {credentials.name} · {credentials.employeeId}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle
            size={16}
            color="#d97706"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <p
            style={{
              fontSize: "13px",
              color: "#92400e",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            These credentials are shown <strong>only once</strong>. Copy and
            share them securely with the employee before closing.
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <p style={labelStyle}>Login Email</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "9px",
              padding: "10px 14px",
            }}
          >
            <Mail size={15} color="#4f46e5" style={{ flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                fontSize: "14px",
                color: "#0f172a",
                fontFamily: "monospace",
              }}
            >
              {credentials.email}
            </span>
            <button
              onClick={() => copy(credentials.email, setCopiedEmail)}
              style={{
                background: copiedEmail ? "#d1fae5" : "#eef2ff",
                border: "none",
                borderRadius: "6px",
                padding: "5px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: copiedEmail ? "#065f46" : "#4f46e5",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {copiedEmail ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copiedEmail ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: "28px" }}>
          <p style={labelStyle}>Generated Password</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "9px",
              padding: "10px 14px",
            }}
          >
            <ShieldCheck size={15} color="#10b981" style={{ flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                fontSize: "15px",
                color: "#0f172a",
                fontFamily: "monospace",
                letterSpacing: "2px",
                filter: showPass ? "none" : "blur(5px)",
                transition: "filter 0.2s",
              }}
            >
              {credentials.generatedPassword}
            </span>
            <button
              onClick={() => setShowPass((p) => !p)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#94a3b8",
              }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              onClick={() =>
                copy(credentials.generatedPassword, setCopiedPassword)
              }
              style={{
                background: copiedPassword ? "#d1fae5" : "#f0fdf4",
                border: "none",
                borderRadius: "6px",
                padding: "5px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: copiedPassword ? "#065f46" : "#16a34a",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {copiedPassword ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copiedPassword ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: "10px",
            background: "linear-gradient(135deg,#4f46e5,#6366f1)",
            border: "none",
            color: "white",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Done — I've saved the credentials
        </button>
      </div>
    </div>
  );
};

/* ── Main AddEmployee Form ───────────────────────────────── */
const AddEmployee = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    jobTitle: "",
    department: "",
    salaryStructure: {
      basicSalary: "",
      hra: "",
      allowances: "",
      bonus: "",
      taxDeduction: "",
      pfDeduction: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSalaryChange = (key, value) =>
    setForm((f) => ({
      ...f,
      salaryStructure: { ...f.salaryStructure, [key]: value },
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Full name and email are required.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/employee/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to create employee.");
      setForm({
        name: "",
        email: "",
        jobTitle: "",
        department: "",
        salaryStructure: {
          basicSalary: "",
          hra: "",
          allowances: "",
          bonus: "",
          taxDeduction: "",
          pfDeduction: "",
        },
      });
      setCredentials(data.credentials);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setCredentials(null);
    onSuccess?.(); // refresh employee list
  };

  return (
    <>
      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={handleModalClose}
        />
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          maxWidth: "860px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          fontFamily: "'Inter', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "22px 28px",
            borderBottom: "1px solid #f1f5f9",
            background: "linear-gradient(135deg,#f8f9ff,#fff)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "11px",
                background: "linear-gradient(135deg,#4f46e5,#6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={18} color="white" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Add New Employee
              </h2>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                Credentials will be auto-generated securely
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "9px",
                padding: "11px 14px",
                marginBottom: "18px",
                fontSize: "13.5px",
                color: "#dc2626",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            {/* Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                <span style={{ color: "#e11d48" }}>*</span> Full Name
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  {/* icon placeholder */}
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Priya Sharma"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.border = "1.5px solid #4f46e5")
                  }
                  onBlur={(e) =>
                    (e.target.style.border = "1.5px solid #e2e8f0")
                  }
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                <span style={{ color: "#e11d48" }}>*</span> Work Email
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "0 12px",
                  transition: "all 0.15s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.border = "1.5px solid #4f46e5")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.border = "1.5px solid #e2e8f0")
                }
              >
                <Mail size={15} color="#6366f1" style={{ flexShrink: 0 }} />

                <input
                  type="email"
                  inputMode="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="priya@company.com"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    padding: "10px 8px",
                    fontSize: "14px",
                    flex: 1,
                    color: "#0f172a",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label style={labelStyle}>
                <Briefcase size={11} style={{ marginRight: 5 }} />
                Job Title
              </label>
              <input
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                style={inputStyle}
                onFocus={(e) => (e.target.style.border = "1.5px solid #4f46e5")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
              />
            </div>

            {/* Department */}
            <div>
              <label style={labelStyle}>
                <Building2 size={11} style={{ marginRight: 5 }} />
                Department
              </label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Engineering"
                style={inputStyle}
                onFocus={(e) => (e.target.style.border = "1.5px solid #4f46e5")}
                onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <label style={labelStyle}>Salary Structure</label>
                <span style={{ fontSize: "12px", color: "#4f46e5", fontWeight: 600 }}>
                  Gross: {formatCurrency(getGrossFromStructure(form.salaryStructure))}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                {[
                  ["basicSalary", "Basic"],
                  ["hra", "HRA"],
                  ["allowances", "Allowances"],
                  ["bonus", "Bonus"],
                  ["taxDeduction", "Tax"],
                  ["pfDeduction", "PF"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.salaryStructure[key]}
                      onChange={(e) => handleSalaryChange(key, e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.border = "1.5px solid #4f46e5")}
                      onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info notices */}
          <div
            style={{
              marginTop: "20px",
              background: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "9px",
              padding: "12px 14px",
              fontSize: "12.5px",
              color: "#166534",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              A <strong>secure password</strong> will be auto-generated using
              cryptographic randomness and hashed with bcrypt. The plain-text is
              shown once after submission.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "22px",
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading
                ? "#c7d2fe"
                : "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "white",
              fontWeight: 600,
              fontSize: "14.5px",
              fontFamily: "'Inter', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.15s",
            }}
          >
            <UserPlus size={16} />
            {loading
              ? "Creating Employee…"
              : "Create Employee & Generate Credentials"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddEmployee;
