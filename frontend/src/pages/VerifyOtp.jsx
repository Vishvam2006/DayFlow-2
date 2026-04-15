import axios from "axios";
import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, EnvelopeSimple, ArrowsClockwise, ShieldCheck } from "@phosphor-icons/react";
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
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to resend OTP.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--color-page)] font-sans">
      <div className="w-full max-w-[480px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo-full.png" alt="DayFlow HRMS" className="h-[54px] object-contain" />
        </div>

        <div className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wider uppercase text-slate-800 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 mb-4">
          <CheckCircle size={14} weight="bold" />
          Verify OTP
        </div>
        
        <h1 className="text-[28px] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight mb-2">Enter the code from your email</h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-5">
          We sent a 6-digit OTP to your registered work email. Enter it below to continue.
        </p>

        <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-slate-50 border border-[var(--color-border)] text-slate-900 text-[14px] font-medium tracking-tight mb-6">
          <EnvelopeSimple size={16} weight="bold" />
          {email}
        </div>

        {error && <div className="bg-[var(--color-danger-bg)] border border-red-200 text-red-700 text-[14px] p-3.5 rounded-[var(--radius-sm)] mb-5">{error}</div>}
        {message && <div className="bg-[var(--color-success-bg)] border border-green-200 text-green-800 text-[14px] p-3.5 rounded-[var(--radius-sm)] mb-5">{message}</div>}

        <form onSubmit={handleVerify}>
          <label className="block text-[14px] font-semibold text-slate-700 mb-2">6-digit OTP</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="w-full py-4 text-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[28px] tracking-[0.45em] text-[var(--color-text-primary)] bg-[var(--color-page)] focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-all placeholder:tracking-[0.3em] font-mono mb-6"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
          />

          <button type="submit" className="w-full py-3.5 bg-slate-900 border border-slate-900 rounded-[var(--radius-sm)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-slate-800 hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer" disabled={loading}>
            {loading ? "Verifying..." : "Verify and sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <Link to="/login/otp" className="inline-flex items-center gap-2 text-slate-900 font-semibold text-[14px] hover:underline">
            <ArrowLeft size={16} weight="bold" />
            Change email
          </Link>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-[var(--radius-sm)] bg-white text-slate-700 text-[13px] font-medium transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            onClick={handleResend}
            disabled={resending}
          >
            <ArrowsClockwise size={16} weight="bold" />
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        <p className="mt-6 text-[12px] text-slate-400">
          OTP expires in 5 minutes and can only be used once.
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
