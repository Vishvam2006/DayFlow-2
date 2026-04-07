import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react";
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
    <div className="flex min-h-screen items-center justify-center p-6 bg-[var(--color-page)] font-sans">
      <div className="w-full max-w-[460px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-lg p-8">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo-full.png" alt="DayFlow HRMS" className="h-[54px] object-contain" />
        </div>

        <div className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wider uppercase text-[var(--color-text-primary)] bg-slate-100 rounded-full px-3 py-1.5 mb-4">
          <EnvelopeSimple size={14} weight="bold" />
          OTP Sign In
        </div>
        
        <h1 className="text-[28px] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight mb-2">Login with a one-time code</h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-6">
          Enter your work email and we&apos;ll send a 6-digit OTP to verify your account.
        </p>

        {error && <div className="bg-[var(--color-danger-bg)] border border-red-200 text-red-700 text-[14px] p-3.5 rounded-[var(--radius-sm)] mb-5">{error}</div>}
        {message && <div className="bg-[var(--color-success-bg)] border border-green-200 text-green-800 text-[14px] p-3.5 rounded-[var(--radius-sm)] mb-5">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label className="block text-[14px] font-semibold text-slate-700 mb-2">Work email</label>
          <div className="relative flex items-center mb-6">
            <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              <EnvelopeSimple size={18} weight="bold" />
            </span>
            <input
              type="email"
              className="w-full py-3.5 pl-10 pr-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[15px] text-[var(--color-text-primary)] bg-[var(--color-page)] focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>

          <button type="submit" className="w-full py-3.5 bg-slate-900 border border-slate-900 rounded-[var(--radius-sm)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-slate-800 hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
            {!loading && <ArrowRight size={18} weight="bold" />}
          </button>
        </form>

        <div className="mt-8 flex justify-between items-center flex-wrap gap-3">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-900 font-semibold text-[14px] hover:underline">
            <ArrowLeft size={16} weight="bold" />
            Back to password login
          </Link>
          <span className="text-[12px] text-slate-400">OTP is valid for 5 minutes</span>
        </div>
      </div>
    </div>
  );
};

export default OtpLogin;
