import { describe, test, expect } from "vitest";
import { calculatePayroll, sanitizeMoney } from "../../../utils/payroll.js";
import { getMonthDateKeys } from "../../../utils/date.js";

describe("Payroll Utility", () => {
    describe("sanitizeMoney", () => {
        test("should return 0 for non-numeric values", () => {
            expect(sanitizeMoney("abc")).toBe(0);
            expect(sanitizeMoney(undefined)).toBe(0);
            expect(sanitizeMoney(null)).toBe(0);
        });

        test("should return 0 for negative values", () => {
            expect(sanitizeMoney(-100)).toBe(0);
        });

        test("should return rounded value for valid numbers", () => {
            expect(sanitizeMoney(100.456)).toBe(100.46);
            expect(sanitizeMoney(100)).toBe(100);
        });
    });

    describe("calculatePayroll", () => {
        const mockEmployee = {
            name: "John Doe",
            salaryStructure: {
                basicSalary: 30000,
                hra: 10000,
                allowances: 5000,
                bonus: 2000,
                taxDeduction: 1000,
                pfDeduction: 1500,
            }
        };

        const month = "2024-03"; // 21 working days (weekdays)

        test("should calculate correct net salary for full attendance", () => {
            const workingDateKeys = getMonthDateKeys(month, { weekdaysOnly: true });
            
            const attendanceRecords = workingDateKeys.map(date => ({
                date,
                status: "Present"
            }));

            const result = calculatePayroll({
                employee: mockEmployee,
                month,
                attendanceRecords
            });

            expect(result.breakdown.grossSalary).toBe(45000);
            expect(result.attendanceSummary.presentDays).toBe(workingDateKeys.length);
            expect(result.breakdown.totalEarnings).toBe(47000);
            expect(result.breakdown.totalDeductions).toBe(2500);
            expect(result.breakdown.netSalary).toBe(44500); // 47000 - 2500
        });

        test("should apply deductions for absent days", () => {
            const workingDateKeys = getMonthDateKeys(month, { weekdaysOnly: true });
            const absentCount = 6;
            
            const attendanceRecords = workingDateKeys.slice(0, workingDateKeys.length - absentCount).map(date => ({
                date,
                status: "Present"
            }));

            const result = calculatePayroll({
                employee: mockEmployee,
                month,
                attendanceRecords
            });

            const perDayRate = 45000 / workingDateKeys.length;
            const expectedLeaveDeduction = perDayRate * absentCount;
            
            expect(result.attendanceSummary.deductionDays).toBe(absentCount);
            expect(result.breakdown.leaveDeduction).toBeCloseTo(expectedLeaveDeduction, 0);
        });

        test("should handle half days correctly", () => {
            const result = calculatePayroll({
                employee: mockEmployee,
                month: "2024-03",
                attendanceRecords: [
                    { date: "2024-03-01", status: "Half Day" }
                ]
            });

            expect(result.attendanceSummary.payableAttendanceDays).toBe(0.5);
        });
    });
});
