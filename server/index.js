import dotenv from "dotenv";
import connectToDatabase from "./db/db.js";
import app from "./app.js";
import { startAttendanceAutomation } from "./services/attendanceAutomationService.js";
import { warnIfEmailEnvInvalid } from "./services/email/emailService.js";

dotenv.config();
warnIfEmailEnvInvalid();

const port = process.env.PORT || 5001;

async function bootstrap() {
  try {
    await connectToDatabase();
    startAttendanceAutomation({ logger: console });

    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
