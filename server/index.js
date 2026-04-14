import dotenv from "dotenv";
import connectToDatabase from "./db/db.js";
import app from "./app.js";
import { startAttendanceAutomation } from "./services/attendanceAutomationService.js";

dotenv.config();

const port = process.env.PORT || 5001;
connectToDatabase();
startAttendanceAutomation({ logger: console });

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
