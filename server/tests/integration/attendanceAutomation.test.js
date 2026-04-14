import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import Leave from "../../models/Leave.js";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import {
  getPreviousDateKey,
  markMissingAttendanceAsAbsent,
  resetAttendanceAutomationState,
  runAttendanceAutomationCycle,
  shouldRunAttendanceAutomation,
} from "../../services/attendanceAutomationService.js";

describe("Attendance Automation Integration Tests", () => {
  beforeAll(async () => await connectDB());
  afterAll(async () => await disconnectDB());

  beforeEach(async () => {
    resetAttendanceAutomationState();
    await clearDB();
  });

  test("marks absent only for employees with no attendance and no approved leave", async () => {
    const [employee1, employee2, employee3] = await User.create([
      {
        name: "Priya",
        email: "priya@example.com",
        phoneNumber: "+919811111111",
        password: "password123",
        role: "employee",
        employeeId: "EMP-2026-1001",
      },
      {
        name: "Arjun",
        email: "arjun@example.com",
        phoneNumber: "+919822222222",
        password: "password123",
        role: "employee",
        employeeId: "EMP-2026-1002",
      },
      {
        name: "Karan",
        email: "karan@example.com",
        phoneNumber: "+919833333333",
        password: "password123",
        role: "employee",
        employeeId: "EMP-2026-1003",
      },
    ]);

    const targetDate = "2026-04-15";

    await Attendance.create({
      employee: employee2._id,
      date: targetDate,
      checkIn: new Date("2026-04-15T09:00:00.000Z"),
      checkOut: new Date("2026-04-15T18:00:00.000Z"),
      workHours: 9,
      status: "Present",
      arrivalStatus: "On Time",
    });

    await Leave.create({
      employee: employee3._id,
      leaveType: "Casual",
      fromDate: new Date("2026-04-15T00:00:00.000Z"),
      toDate: new Date("2026-04-15T23:59:59.999Z"),
      reason: "Approved leave",
      status: "Approved",
    });

    const result = await markMissingAttendanceAsAbsent({ dateKey: targetDate });

    expect(result.createdCount).toBe(1);
    expect(result.employeeIds).toEqual(["EMP-2026-1001"]);

    const records = await Attendance.find({ date: targetDate }).sort({ employee: 1 });
    expect(records).toHaveLength(2);
    expect(records.find((record) => String(record.employee) === String(employee1._id))?.status).toBe("Absent");
    expect(records.find((record) => String(record.employee) === String(employee2._id))?.status).toBe("Present");
    expect(records.find((record) => String(record.employee) === String(employee3._id))).toBeUndefined();
  });

  test("skips weekend automation runs by default", async () => {
    await User.create({
      name: "Weekend Employee",
      email: "weekend@example.com",
      phoneNumber: "+919844444444",
      password: "password123",
      role: "employee",
      employeeId: "EMP-2026-1004",
    });

    const result = await markMissingAttendanceAsAbsent({ dateKey: "2026-04-18" });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("non_working_day");
    expect(await Attendance.countDocuments()).toBe(0);
  });

  test("runs the automation once per local day and targets the previous day", async () => {
    await User.create({
      name: "Cycle Employee",
      email: "cycle@example.com",
      phoneNumber: "+919855555555",
      password: "password123",
      role: "employee",
      employeeId: "EMP-2026-1005",
    });

    expect(
      shouldRunAttendanceAutomation({
        now: new Date("2026-04-16T19:10:00.000Z"),
        timeZone: "Asia/Kolkata",
        runAt: "00:30",
      }),
    ).toBe(true);

    const firstRun = await runAttendanceAutomationCycle({
      now: new Date("2026-04-16T19:10:00.000Z"),
      timeZone: "Asia/Kolkata",
      runAt: "00:30",
    });

    expect(firstRun?.dateKey).toBe(getPreviousDateKey("2026-04-17"));
    expect(firstRun?.createdCount).toBe(1);

    const secondRun = await runAttendanceAutomationCycle({
      now: new Date("2026-04-16T19:15:00.000Z"),
      timeZone: "Asia/Kolkata",
      runAt: "00:30",
    });

    expect(secondRun).toBeNull();
    expect(await Attendance.countDocuments({ date: "2026-04-16" })).toBe(1);
  });
});
