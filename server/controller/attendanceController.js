import Attendance from "../models/Attendance.js";
import { extractClientIPv4 } from "../middleware/clientIpMiddleware.js";
import {
  checkInEmployee,
  checkOutEmployee,
  getAttendanceLogsForEmployee,
  getTodayAttendanceForEmployee,
  getYearAttendanceForEmployee,
  serializeAttendanceRecord,
} from "../services/attendanceService.js";
import { verifyIpAgainstCompanyNetwork } from "../services/networkSecurityService.js";
import { sendError, sendSuccess } from "../utils/httpResponse.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";

const checkIn = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const deviceIP = req.clientIP || extractClientIPv4(req);
    const { attendance, isFlagged, networkVerification } = await checkInEmployee({
      employeeId: req.user._id,
      deviceIP,
    });

    return sendSuccess(res, 200, {
      message: isFlagged
        ? "Checked in from an unapproved network and flagged for HR review."
        : "Check-In Succesfull",
      isFlagged,
      networkVerification,
      attendance,
    });
  } catch (error) {
    if (error.code === "already_checked_in" || error.code === "duplicate_attendance_record") {
      return sendError(res, 400, "Already checked in today");
    }

    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Attendance server error."
    );
  }
};

const checkOut = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const { attendance, workHours } = await checkOutEmployee({
      employeeId: req.user._id,
    });

    return sendSuccess(res, 200, {
      attendance,
      diff: workHours,
    });
  } catch (error) {
    if (error.code === "missing_check_in") {
      return sendError(res, 400, "Check In first");
    }

    if (error.code === "already_checked_out") {
      return sendError(res, 400, "Already checked out today");
    }

    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Attendance server error."
    );
  }
};

const getAttendance = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const attendance = await getTodayAttendanceForEmployee({
      employeeId: req.user._id,
    });

    return sendSuccess(res, 200, {
      attendance,
    });
  } catch (error) {
    return sendError(res, 500, "Fetch attendance server error.");
  }
};

const getYearAttendance = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const year = Number(req.query.year) || new Date().getFullYear();
    const attendance = await getYearAttendanceForEmployee({
      employeeId: req.user._id,
      year,
    });

    return sendSuccess(res, 200, {
      year,
      attendance,
    });
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Error fetching yearly attendance."
    );
  }
};

const getAttendanceLogs = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const { page, limit } = parsePagination(req.query, {
      defaultLimit: 8,
      maxLimit: 50,
    });
    const result = await getAttendanceLogsForEmployee({
      employeeId: req.user._id,
      page,
      limit,
    });
    const pagination = buildPaginationMeta({
      page,
      limit,
      totalItems: result.totalItems,
    });

    return sendSuccess(res, 200, {
      records: result.records,
      ...pagination,
    });
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || "Error fetching attendance logs."
    );
  }
};

const verifyClockInNetwork = async (req, res) => {
  try {
    const deviceIP = req.clientIP || extractClientIPv4(req);
    if (!deviceIP) {
      return sendSuccess(res, 200, {
        authorized: false,
        code: "ip_unavailable",
        message: "Unable to verify current network.",
      });
    }

    const verification = await verifyIpAgainstCompanyNetwork(deviceIP);

    return sendSuccess(res, 200, {
      authorized: verification.authorized,
      code: verification.reason,
      deviceIP,
      officeName: verification.network?.officeName || null,
      message: verification.authorized
        ? `Connected to ${verification.network.officeName}.`
        : "This network is not whitelisted. Check-in will be allowed but flagged for HR review.",
    });
  } catch (error) {
    return sendError(res, 500, "Unable to verify network status right now.", {
      authorized: false,
    });
  }
};

const getFlaggedAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 8,
      maxLimit: 100,
    });

    const [records, totalItems] = await Promise.all([
      Attendance.find({ isFlagged: true })
        .populate("employee", "name email employeeId department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments({ isFlagged: true }),
    ]);
    const pagination = buildPaginationMeta({ page, limit, totalItems });

    return sendSuccess(res, 200, {
      records: records.map((record) => ({
        ...serializeAttendanceRecord(record),
        employee: record.employee,
      })),
      ...pagination,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch flagged attendance records.");
  }
};

export {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceLogs,
  getYearAttendance,
  verifyClockInNetwork,
  getFlaggedAttendance,
};
