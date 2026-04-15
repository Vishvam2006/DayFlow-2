import axios from "axios";
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { EnvelopeSimple, Lock, ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../config/api.js";

const useGreeting = () => {
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return greeting;
};

const ParallaxHero = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / (rect.width / 2));
    y.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const badgeOffsetX = useTransform(smoothX, [-1, 1], [20, -20]);
  const badgeOffsetY = useTransform(smoothY, [-1, 1], [20, -20]);

  const blobX1 = useTransform(smoothX, [-1, 1], [-30, 30]);
  const blobY1 = useTransform(smoothY, [-1, 1], [-30, 30]);
  
  const blobX2 = useTransform(smoothX, [-1, 1], [30, -30]);
  const blobY2 = useTransform(smoothY, [-1, 1], [30, -30]);

  return (
    <div 
      className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center text-white p-12"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        style={{ x: blobX1, y: blobY1 }}
        className="absolute w-[500px] h-[500px] bg-slate-800 rounded-full blur-[100px] -top-[100px] -right-[100px] opacity-60 pointer-events-none" 
      />
      <motion.div 
        style={{ x: blobX2, y: blobY2 }}
        className="absolute w-[400px] h-[400px] bg-slate-800 rounded-full blur-[100px] -bottom-[100px] -left-[100px] opacity-60 pointer-events-none" 
      />
      
      <div className="relative z-10 max-w-[440px] text-center pointer-events-none">
        <motion.div 
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 flex justify-center text-slate-300 pointer-events-auto items-center h-[72px]"
        >
          <img src="/logo-full.png" alt="DayFlow HRMS" className="h-[64px] object-contain invert brightness-0 filter drop-shadow-lg" />
        </motion.div>
        <h2 className="text-[36px] font-bold mb-4 tracking-tight leading-tight pointer-events-auto" style={{ textShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
          The modern way to manage people
        </h2>
        <p className="text-[17px] text-slate-300 leading-relaxed mb-10 pointer-events-auto">
          Streamline your HR operations with our professional platform for attendance, tasks, and more.
        </p>
        
        <motion.div 
          style={{ x: badgeOffsetX, y: badgeOffsetY }}
          className="flex flex-wrap justify-center gap-3 pointer-events-auto"
        >
          {["Real-time Tracking", "Smart Leaves", "Task Analytics"].map((f) => (
            <span 
              key={f} 
              className="bg-slate-800/80 px-4 py-2 rounded-full text-[13px] font-semibold border border-slate-700 backdrop-blur-sm shadow-lg hover:bg-slate-700/80 transition-colors"
            >
              {f}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState("password"); // "password" | "otp"
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const greeting = useGreeting();

  const isB2bDomain = useMemo(() => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    return domain.includes('.') && !genericDomains.includes(domain);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (loginMode === "password") {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
        if (response.data.success) {
          login(response.data.user);
          localStorage.setItem("token", response.data.token);
          navigate(response.data.user.role === "admin" ? "/admin-dashboard" : "/employee-dashboard");
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login/send-otp`, { email });
        sessionStorage.setItem("otpLoginEmail", email);
        setMessage(response.data.message || "OTP sent successfully. Redirecting...");
        setTimeout(() => {
          navigate("/login/otp/verify", { state: { email } });
        }, 1200);
      }
    } catch (err) {
      if (loginMode === "password") {
        setError(err.response?.data?.error || "Server error. Please try again.");
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to send OTP right now.",
        );
      }
    } finally {
      if (loginMode === "password") {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] font-sans">
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <motion.div 
          layout 
          className="w-full max-w-[420px] bg-[var(--color-card)] rounded-[var(--radius-lg)] p-8 lg:p-10 shadow-lg border border-[var(--color-border)]"
        >
          <motion.h1 layout="position" className="text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
            {greeting}
          </motion.h1>
          <motion.div layout="position" className="text-[15px] text-[var(--color-text-secondary)] mb-8">
            <AnimatePresence mode="wait">
              <motion.span 
                key={loginMode} 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {loginMode === "password" ? "Sign in to manage your workspace" : "Enter your work email to receive an OTP"}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }} 
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[var(--color-danger-bg)] border border-red-200 rounded-[var(--radius-sm)] p-3 text-red-700 text-sm flex items-center gap-2">
                  <span role="img" aria-label="warning">⚠️</span> {error}
                </div>
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }} 
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[var(--color-success-bg)] border border-green-200 rounded-[var(--radius-sm)] p-3 text-green-700 text-sm flex items-center gap-2">
                  <span role="img" aria-label="success">✅</span> {message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form layout="position" onSubmit={handleSubmit} className="flex flex-col">
            <motion.div layout="position" className="mb-5">
              <label className="block text-[14px] font-semibold text-slate-700 mb-2">Email address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center z-10">
                  <EnvelopeSimple size={18} weight="bold" />
                </span>
                <input
                  type="email"
                  className="w-full py-3.5 pl-10 pr-12 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[15px] text-[var(--color-text-primary)] bg-[var(--color-page)] focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-all relative z-0"
                  value={email}
                  placeholder="name@company.com"
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <AnimatePresence>
                  {isB2bDomain && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, x: 10 }}
                      className="absolute right-3 text-green-600 flex items-center justify-center bg-green-50 rounded-full p-1.5 shadow-sm z-10"
                      title="Workspace recognized"
                    >
                      <ShieldCheck size={16} weight="fill" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <AnimatePresence initial={false}>
              {loginMode === "password" && (
                <motion.div
                  key="password-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mb-5">
                    <label className="block text-[14px] font-semibold text-slate-700 mb-2">Password</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                        <Lock size={18} weight="bold" />
                      </span>
                      <input
                        type="password"
                        className="w-full py-3.5 pl-10 pr-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[15px] text-[var(--color-text-primary)] bg-[var(--color-page)] focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-all"
                        value={password}
                        placeholder="••••••••"
                        onChange={e => setPassword(e.target.value)}
                        required={loginMode === "password"}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              layout="position" 
              type="submit" 
              className="w-full py-3.5 mt-2 bg-slate-900 border border-slate-900 rounded-[var(--radius-sm)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-slate-800 hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer" 
              disabled={loading}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span 
                    key="loading" 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    {loginMode === "password" ? "Signing in..." : "Sending OTP..."}
                  </motion.span>
                ) : (
                  <motion.span 
                    key="idle" 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    {loginMode === "password" ? "Sign in" : "Send OTP"} <ArrowRight size={18} weight="bold" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.form>

          <motion.div layout="position" className="relative my-6 text-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)]"></div>
            <span className="relative inline-block px-3 bg-[var(--color-card)] text-slate-400 text-[12px] font-semibold uppercase tracking-wider">or</span>
          </motion.div>

          <motion.button 
            layout="position"
            type="button"
            onClick={() => {
              setLoginMode(prev => prev === "password" ? "otp" : "password");
              setError(null);
            }}
            className="w-full py-3 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white text-slate-700 text-[15px] font-semibold decoration-transparent transition-all hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
          >
            <EnvelopeSimple size={18} weight="bold" />
            <AnimatePresence mode="wait">
               <motion.span 
                 key={loginMode} 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }} 
                 transition={{ duration: 0.15 }}
               >
                  {loginMode === "password" ? "Login via OTP" : "Back to password login"}
               </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.p layout="position" className="text-center text-slate-400 text-xs mt-8">© 2026 DayFlow HRMS</motion.p>
        </motion.div>
      </div>

      <ParallaxHero />
    </div>
  );
};

export default Login;
