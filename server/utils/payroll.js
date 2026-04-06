import {
  formatMonthLabel,
  getMonthDateKeys,
  listDateKeysInRange,
  roundToNumber,
} from "./date.js";

const sanitizeMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }
  return roundToNumber(amount);
};

const normalizeSalaryStructure = (salaryStructure = {}) => ({
  basicSalary: sanitizeMoney(salaryStructure.basicSalary),
  hra: sanitizeMoney(salaryStructure.hra),
  allowances: sanitizeMoney(salaryStructure.allowances),
  bonus: sanitizeMoney(salaryStructure.bonus),
  taxDeduction: sanitizeMoney(salaryStructure.taxDeduction),
  pfDeduction: sanitizeMoney(salaryStructure.pfDeduction),
});

const getGrossSalary = (salaryStructure) =>
  sanitizeMoney(
    salaryStructure.basicSalary +
      salaryStructure.hra +
      salaryStructure.allowances
  );

const buildEmployeeSnapshot = (employee) => ({
  name: employee.name,
  email: employee.email,
  employeeId: employee.employeeId || "",
  department: employee.department || "",
  jobTitle: employee.jobTitle || "",
});

const calculatePayroll = ({
  employee,
  month,
  attendanceRecords = [],
  leaveRecords = [],
}) => {
  const salaryStructure = normalizeSalaryStructure(employee.salaryStructure);
  const workingDateKeys = getMonthDateKeys(month, { weekdaysOnly: true });
  const workingDateSet = new Set(workingDateKeys);
  const attendanceByDate = new Map();

  let presentDays = 0;
  let halfDays = 0;
  let payableAttendanceDays = 0;

  for (const record of attendanceRecords) {
    if (!workingDateSet.has(record.date)) {
      continue;
    }

    attendanceByDate.set(record.date, record);

    if (record.status === "Present") {
      presentDays += 1;
      payableAttendanceDays += 1;
    } else if (record.status === "Half Day") {
      halfDays += 1;
      payableAttendanceDays += 0.5;
    }
  }

  const paidLeaveDates = new Set();
  const unpaidLeaveDates = new Set();

  for (const leave of leaveRecords) {
    if (leave.status !== "Approved") {
      continue;
    }

    const leaveDates = listDateKeysInRange(leave.fromDate, leave.toDate, {
      weekdaysOnly: true,
    });

    for (const leaveDate of leaveDates) {
      if (!workingDateSet.has(leaveDate)) {
        continue;
      }

      const attendanceRecord = attendanceByDate.get(leaveDate);
      if (attendanceRecord && ["Present", "Half Day"].includes(attendanceRecord.status)) {
        continue;
      }

      if (leave.leaveType === "Unpaid") {
        paidLeaveDates.delete(leaveDate);
        unpaidLeaveDates.add(leaveDate);
      } else if (!unpaidLeaveDates.has(leaveDate)) {
        paidLeaveDates.add(leaveDate);
      }
    }
  }

  const paidLeaveDays = paidLeaveDates.size;
  const unpaidLeaveDays = unpaidLeaveDates.size;
  const workingDays = workingDateKeys.length;
  const grossSalary = getGrossSalary(salaryStructure);
  const perDayRate = workingDays > 0 ? sanitizeMoney(grossSalary / workingDays) : 0;
  const deductionDays = sanitizeMoney(
    Math.max(workingDays - payableAttendanceDays - paidLeaveDays, 0)
  );
  const leaveDeduction = sanitizeMoney(perDayRate * deductionDays);
  const totalEarnings = sanitizeMoney(grossSalary + salaryStructure.bonus);
  const totalDeductions = sanitizeMoney(
    leaveDeduction +
      salaryStructure.taxDeduction +
      salaryStructure.pfDeduction
  );
  const netSalary = sanitizeMoney(Math.max(totalEarnings - totalDeductions, 0));

  return {
    month,
    monthLabel: formatMonthLabel(month),
    employeeSnapshot: buildEmployeeSnapshot(employee),
    salaryStructure,
    attendanceSummary: {
      workingDays,
      presentDays,
      halfDays,
      payableAttendanceDays: sanitizeMoney(payableAttendanceDays),
      paidLeaveDays,
      unpaidLeaveDays,
      deductionDays,
    },
    breakdown: {
      perDayRate,
      grossSalary,
      bonus: salaryStructure.bonus,
      totalEarnings,
      leaveDeduction,
      taxDeduction: salaryStructure.taxDeduction,
      pfDeduction: salaryStructure.pfDeduction,
      totalDeductions,
      netSalary,
    },
  };
};

export {
  calculatePayroll,
  normalizeSalaryStructure,
  sanitizeMoney,
};
