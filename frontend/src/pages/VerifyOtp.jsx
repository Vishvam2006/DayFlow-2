import axios from "axios";
import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/authContext";
import API_BASE_URL from "../config/api.js";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = useMemo(
    () => location.state?.email || sessionStorage.getItem("otpLoginEmail") || "",
    [location.state],
  );

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return <Navigate to="/login/otp" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/verify-otp`, {
        email,
        otp,
      });

      if (response.data.success) {
        login(response.data.user);
        localStorage.setItem("token", response.data.token);
        sessionStorage.removeItem("otpLoginEmail");
        navigate(
          response.data.user.role === "admin"
            ? "/admin-dashboard"
            : "/employee-dashboard",
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/send-otp`, {
        email,
      });

      setMessage(response.data.message || "OTP sent successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{`
        .otp-verify-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(79, 70, 229, 0.18), transparent 30%),
            radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.12), transparent 26%),
            #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .otp-verify-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
          padding: 34px;
        }
        .otp-verify-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .otp-verify-brand-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #4f46e5, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .otp-verify-brand-name {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .otp-verify-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .otp-verify-title {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #0f172a;
        }
        .otp-verify-subtitle {
          margin: 0 0 22px;
          font-size: 15px;
          line-height: 1.7;
          color: #64748b;
        }
        .otp-verify-email {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 22px;
          word-break: break-all;
        }
        .otp-verify-alert {
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 14px;
          margin-bottom: 18px;
        }
        .otp-verify-alert.error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }
        .otp-verify-alert.success {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .otp-verify-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }
        .otp-verify-input {
          width: 100%;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          padding: 16px;
          font-size: 28px;
          letter-spacing: 0.45em;
          text-align: center;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .otp-verify-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          background: #ffffff;
        }
        .otp-verify-input::placeholder {
          letter-spacing: 0.3em;
        }
        .otp-verify-button {
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
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .otp-verify-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(79, 70, 229, 0.22);
        }
        .otp-verify-button:disabled,
        .otp-verify-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .otp-verify-actions {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .otp-verify-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #4f46e5;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }
        .otp-verify-secondary {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          border-radius: 12px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .otp-verify-footnote {
          margin-top: 18px;
          font-size: 12px;
          color: #94a3b8;
        }
        @media (max-width: 600px) {
          .otp-verify-card {
            padding: 24px;
            border-radius: 20px;
          }
          .otp-verify-title {
            font-size: 26px;
          }
          .otp-verify-input {
            font-size: 24px;
            letter-spacing: 0.3em;
          }
        }
      `}</style>

      <div className="otp-verify-page">
        <div className="otp-verify-card">
          <div className="otp-verify-brand">
            <div className="otp-verify-brand-icon">
              <ShieldCheck size={22} />
            </div>
            <span className="otp-verify-brand-name">DayFlow</span>
          </div>

          <div className="otp-verify-badge">
            <CheckCircle2 size={14} />
            Verify OTP
          </div>
          <h1 className="otp-verify-title">Enter the code from your email</h1>
          <p className="otp-verify-subtitle">
            We sent a 6-digit OTP to your registered work email. Enter it below
            to continue.
          </p>

          <div className="otp-verify-email">
            <Mail size={16} />
            {email}
          </div>

          {error ? <div className="otp-verify-alert error">{error}</div> : null}
          {message ? (
            <div className="otp-verify-alert success">{message}</div>
          ) : null}

          <form onSubmit={handleVerify}>
            <label className="otp-verify-label">6-digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="otp-verify-input"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              required
            />

            <button className="otp-verify-button" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify and sign in"}
            </button>
          </form>

          <div className="otp-verify-actions">
            <Link to="/login/otp" className="otp-verify-link">
              <ArrowLeft size={16} />
              Change email
            </Link>

            <button
              type="button"
              className="otp-verify-secondary"
              onClick={handleResend}
              disabled={resending}
            >
              <RefreshCw size={16} />
              {resending ? "Resending..." : "Resend OTP"}
            </button>
          </div>

          <p className="otp-verify-footnote">
            OTP expires in 5 minutes and can only be used once.
          </p>
        </div>
      </div>
    </>
  );
};

export default VerifyOtp;
