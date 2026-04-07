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
import connectToDatabase from "./db/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5000;
connectToDatabase();

const app = express();

app.use(cors({
  origin: [
    "https://day-flow-2.vercel.app/",
    "https://day-flow-beta.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  credentials: true,
}));
app.use(express.json());

// Serve uploaded profile images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRouter);
app.use("/api/department", departmentRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/profile", profileRouter);
app.use("/api/task", taskRouter);
app.use("/api/payroll", payrollRouter);

const frontendDistPath = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
