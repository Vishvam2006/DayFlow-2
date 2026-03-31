import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import API_BASE_URL from "../config/api.js";

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
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
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

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .login-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          border: 1px solid #f1f5f9;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .login-brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .login-brand-name {
          font-weight: 800;
          font-size: 26px;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .login-heading {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .login-sub {
          color: #64748b;
          font-size: 15px;
          margin-bottom: 28px;
        }
        .login-error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          padding: 12px 16px;
          color: #be123c;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
        }
        .login-field {
          margin-bottom: 20px;
        }
        .login-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
          display: flex;
          align-items: center;
        }
        .login-input {
          display: block;
          width: 100%;
          padding: 14px 14px 14px 44px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          font-size: 15px;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          -webkit-appearance: none;
          appearance: none;
        }
        .login-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        .login-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          background: #fff;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          margin-top: 8px;
          background: #4f46e5;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn:hover {
          background: #4338ca;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-footer {
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          margin-top: 28px;
        }
        .login-divider {
          position: relative;
          margin: 22px 0 18px;
          text-align: center;
        }
        .login-divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
        }
        .login-divider span {
          position: relative;
          display: inline-block;
          padding: 0 12px;
          background: #ffffff;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .login-otp-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
          box-sizing: border-box;
        }
        .login-otp-link:hover {
          border-color: #4f46e5;
          color: #4f46e5;
          background: #f8fafc;
        }
        .login-right {
          flex: 1;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }
        .login-right-content {
          text-align: center;
          max-width: 400px;
          position: relative;
          z-index: 2;
        }
        .login-right h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        .login-right p {
          opacity: 0.9;
          font-size: 17px;
          line-height: 1.7;
          font-weight: 400;
        }
        .login-tags {
          display: flex;
          gap: 10px;
          margin-top: 40px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .login-tag {
          background: rgba(255,255,255,0.15);
          padding: 10px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .login-blob-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: white;
          border-radius: 50%;
          filter: blur(120px);
          top: -150px;
          right: -150px;
          opacity: 0.4;
        }
        .login-blob-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          background: #818cf8;
          border-radius: 50%;
          filter: blur(100px);
          bottom: -100px;
          left: -100px;
          opacity: 0.4;
        }
        @media (max-width: 800px) {
          .login-right { display: none; }
          .login-left { padding: 24px; }
        }
      `}</style>

      <div className="login-page">
        <div className="login-left">
          <div className="login-card">
            <div className="login-brand">
              <div className="login-brand-icon">
                <ShieldCheck size={22} />
              </div>
              <span className="login-brand-name">DayFlow</span>
            </div>

            <h1 className="login-heading">Welcome back</h1>
            <p className="login-sub">Sign in to manage your workspace</p>

            {error && <div className="login-error"><span>⚠️</span> {error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label className="login-label">Email address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><Mail size={18} /></span>
                  <input
                    type="email"
                    className="login-input"
                    value={email}
                    placeholder="name@company.com"
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><Lock size={18} /></span>
                  <input
                    type="password"
                    className="login-input"
                    value={password}
                    placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Signing in..." : <>Sign in <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="login-divider">
              <span>or</span>
            </div>

            <Link to="/login/otp" className="login-otp-link">
              <Mail size={18} />
              Login via OTP
            </Link>

            <p className="login-footer">© 2026 DayFlow HRMS</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-blob-1" />
          <div className="login-blob-2" />
          <div className="login-right-content">
            <div style={{ fontSize: "72px", marginBottom: "28px" }}>⚡</div>
            <h2>The modern way to manage people</h2>
            <p>Streamline your HR operations with our professional platform for attendance, tasks, and more.</p>
            <div className="login-tags">
              {["Real-time Tracking", "Smart Leaves", "Task Analytics"].map(f => (
                <span key={f} className="login-tag">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
