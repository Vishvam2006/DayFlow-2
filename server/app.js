import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import departmentRouter from "./routes/department.js";
import employeeRouter from "./routes/employee.js";
import leaveRouter from "./routes/leave.js";
import attendanceRouter from "./routes/attendance.js";
import profileRouter from "./routes/profile.js";
import taskRouter from "./routes/task.js";
import payrollRouter from "./routes/payroll.js";
import companyNetworkRouter from "./routes/companyNetwork.js";
import analyticsRoutes from "./routes/analytics.js";
import botRouter from "./routes/bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeOrigin = (origin) =>
  String(origin || "")
    .trim()
    .replace(/\/$/, "");

const defaultAllowedOrigins = [
  "https://day-flow-2.vercel.app",
  "https://day-flow-beta.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://dayflow.co.in/",
].map(normalizeOrigin);

const customOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins, ...customOrigins.map(normalizeOrigin)]),
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-bot-secret-key",
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

const app = express();

// Trust all proxies unconditionally. Secure enough for this use case
// and fixes IP detection across any PaaS (Render, Vercel, Heroku)
app.set("trust proxy", true);

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRouter);
app.use("/api/department", departmentRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/profile", profileRouter);
app.use("/api/task", taskRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/company-network", companyNetworkRouter);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/bot", botRouter);



const frontendDistPath = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

export default app;
