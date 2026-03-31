import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import API_BASE_URL from "../config/api.js";

const OtpLogin = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/send-otp`, {
        email,
      });

      sessionStorage.setItem("otpLoginEmail", email);
      setMessage(response.data.message || "OTP sent successfully.");
      navigate("/login/otp/verify", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .otp-auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(79, 70, 229, 0.16), transparent 28%),
            radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.14), transparent 26%),
            #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .otp-auth-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
          padding: 34px;
        }
        .otp-auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .otp-auth-brand-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #4f46e5, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }
        .otp-auth-brand-name {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .otp-auth-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4f46e5;
          background: #eef2ff;
          border-radius: 999px;
          padding: 8px 12px;
          margin-bottom: 16px;
        }
        .otp-auth-title {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1.15;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .otp-auth-subtitle {
          margin: 0 0 24px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
        }
        .otp-auth-alert {
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 14px;
          margin-bottom: 18px;
        }
        .otp-auth-alert.error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }
        .otp-auth-alert.success {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .otp-auth-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }
        .otp-auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .otp-auth-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }
        .otp-auth-input {
          width: 100%;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 14px 14px 14px 44px;
          font-size: 15px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .otp-auth-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          background: #ffffff;
        }
        .otp-auth-button {
          width: 100%;
          margin-top: 20px;
          border: none;
          border-radius: 14px;
          padding: 14px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .otp-auth-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(79, 70, 229, 0.22);
        }
        .otp-auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .otp-auth-meta {
          margin-top: 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .otp-auth-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #4f46e5;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }
        .otp-auth-note {
          font-size: 12px;
          color: #94a3b8;
        }
        @media (max-width: 600px) {
          .otp-auth-card {
            padding: 24px;
            border-radius: 20px;
          }
          .otp-auth-title {
            font-size: 26px;
          }
        }
      `}</style>

      <div className="otp-auth-page">
        <div className="otp-auth-card">
          <div className="otp-auth-brand">
            <div className="otp-auth-brand-icon">
              <ShieldCheck size={22} />
            </div>
            <span className="otp-auth-brand-name">DayFlow</span>
          </div>

          <div className="otp-auth-kicker">
            <Mail size={14} />
            OTP Sign In
          </div>
          <h1 className="otp-auth-title">Login with a one-time code</h1>
          <p className="otp-auth-subtitle">
            Enter your work email and we&apos;ll send a 6-digit OTP to verify
            your account.
          </p>

          {error ? <div className="otp-auth-alert error">{error}</div> : null}
          {message ? (
            <div className="otp-auth-alert success">{message}</div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <label className="otp-auth-label">Work email</label>
            <div className="otp-auth-input-wrap">
              <span className="otp-auth-input-icon">
                <Mail size={18} />
              </span>
              <input
                type="email"
                className="otp-auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <button className="otp-auth-button" type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <div className="otp-auth-meta">
            <Link to="/login" className="otp-auth-link">
              <ArrowLeft size={16} />
              Back to password login
            </Link>
            <span className="otp-auth-note">OTP is valid for 5 minutes</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OtpLogin;
