import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import departmentRouter from "./routes/department.js";
import employeeRouter from "./routes/employee.js";
import leaveRouter from "./routes/leave.js";
import attendanceRouter from "./routes/attendance.js";
import profileRouter from "./routes/profile.js";
import taskRouter from "./routes/task.js";
import connectToDatabase from "./db/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5000;
connectToDatabase();

const app = express();

app.use(cors());
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

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
