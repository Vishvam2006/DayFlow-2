import axios from "axios";
import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      if (response.data.success) {
        login(response.data.user);
        localStorage.setItem("token", response.data.token);
        navigate(response.data.user.role === "admin" ? "/admin-dashboard" : "/employee-dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const S = {
    page: {
      minHeight: "100vh",
      display: "flex",
      background: "#f8fafc",
      fontFamily: "Inter, sans-serif"
    },

    left: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px"
    },

    card: {
      width: "100%",
      maxWidth: "420px",
      background: "#ffffff",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
      border: "1px solid #f1f5f9"
    },

    brand: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "40px"
    },

    logo: {
      width: "42px",
      height: "42px",
      borderRadius: "12px",
      background: "#4f46e5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white"
    },

    heading: {
      fontSize: "28px",
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: "6px"
    },

    sub: {
      color: "#64748b",
      fontSize: "14px",
      marginBottom: "28px"
    },

    error: {
      background: "#fff1f2",
      border: "1px solid #fecdd3",
      borderRadius: "10px",
      padding: "12px",
      color: "#be123c",
      fontSize: "14px",
      marginBottom: "20px"
    },

    inputGroup: {
      marginBottom: "18px"
    },

    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 600,
      color: "#334155",
      marginBottom: "6px"
    },

    inputContainer: {
      position: "relative"
    },

    icon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8"
    },

    input: {
      width: "100%",
      padding: "12px 12px 12px 38px",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      fontSize: "14px",
      color: "#0f172a",
      outline: "none",
      transition: "all 0.2s",
      background: "#f8fafc",
      fontFamily: "inherit"
    },

    btn: {
      width: "100%",
      padding: "12px",
      marginTop: "12px",
      background: "#4f46e5",
      border: "none",
      borderRadius: "10px",
      color: "#fff",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s"
    },

    footer: {
      textAlign: "center",
      color: "#94a3b8",
      fontSize: "12px",
      marginTop: "24px"
    },

    right: {
      flex: 1,
      background: "linear-gradient(135deg, #4f46e5, #6366f1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      padding: "40px"
    }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.card}>
          <div style={S.brand}>
            <div style={S.logo}>
              <ShieldCheck size={28} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "28px", color: "#0f172a", letterSpacing: "-0.04em" }}>DayFlow</span>
          </div>
          <h1 style={S.heading}>Welcome back</h1>
          <p style={S.sub}>Sign in to manage your workspace</p>

          {error && <div style={S.error}><span>⚠️</span> {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            <div style={S.inputGroup}>
              <label style={S.label}>Email address</label>
              <div style={S.inputContainer}>
                <Mail size={20} style={S.icon} />
                <input type="email" value={email} placeholder="name@company.com"
                  onChange={e => setEmail(e.target.value)} required style={S.input}
                  onFocus={e => {
                    e.target.style.borderColor = "#4f46e5";
                    e.target.style.boxShadow = "0 0 0 4px rgba(79, 70, 229, 0.15)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
            <div style={S.inputGroup}>
              <label style={S.label}>Password</label>
              <div style={S.inputContainer}>
                <Lock size={20} style={S.icon} />
                <input type="password" value={password} placeholder="••••••••"
                  onChange={e => setPassword(e.target.value)} required style={S.input}
                  onFocus={e => {
                    e.target.style.borderColor = "#4f46e5";
                    e.target.style.boxShadow = "0 0 0 4px rgba(79, 70, 229, 0.15)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in..." : <>Sign in <ArrowRight size={20} /></>}
            </button>
          </form>

          <p style={S.footer}>© 2026 DayFlow HRMS</p>
        </div>
      </div>

      {/* Right Panel */}
      <div style={S.right}>
        <div style={{ textAlign: "center", maxWidth: "440px", zIndex: 2 }}>
          <div style={{
            fontSize: "84px",
            marginBottom: "36px",
            filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.15))"
          }}>⚡</div>
          <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "20px", letterSpacing: "-0.04em", lineHeight: 1.2 }}>The modern way to manage people</h2>
          <p style={{ opacity: 0.95, fontSize: "19px", lineHeight: 1.7, fontWeight: 500 }}>Streamline your HR operations with our professional platform for attendance, tasks, and more.</p>

          <div style={{ display: "flex", gap: "12px", marginTop: "54px", justifyContent: "center", flexWrap: "wrap" }}>
            {["Real-time Tracking", "Smart Leave Management", "Task Analytics"].map(f => (
              <span key={f} style={{
                background: "rgba(255, 255, 255, 0.2)",
                padding: "12px 24px",
                borderRadius: "16px",
                fontSize: "15px",
                fontWeight: 700,
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(8px)"
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Abstract artistic background */}
        <div style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          overflow: "hidden",
          opacity: 0.5
        }}>
          <div style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            background: "white",
            borderRadius: "50%",
            filter: "blur(120px)",
            top: "-150px",
            right: "-150px"
          }} />
          <div style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            background: "#818cf8",
            borderRadius: "50%",
            filter: "blur(100px)",
            bottom: "-100px",
            left: "-100px"
          }} />
        </div>
      </div>
    </div>
  );
};

export default Login;
