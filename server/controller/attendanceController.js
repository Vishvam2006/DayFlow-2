import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { toDateKey } from "../utils/date.js";
import { extractClientIPv4 } from "../middleware/clientIpMiddleware.js";
import { verifyIpAgainstCompanyNetwork } from "../services/networkSecurityService.js";
import { sendError, sendSuccess } from "../utils/httpResponse.js";

const checkIn = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const today = toDateKey();
    const todayStart = new Date(`${today}T00:00:00.000`);
    const todayEnd = new Date(`${today}T23:59:59.999`);
    const deviceIP = req.clientIP || extractClientIPv4(req);
    const verification = deviceIP
      ? await verifyIpAgainstCompanyNetwork(deviceIP)
      : { authorized: false, reason: "ip_unavailable", network: null };
    const isFlagged = !verification.authorized;

    const existing = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });

    if (existing) {
      return sendError(res, 400, "Already checked in today");
    }

    const approvedLeave = await Leave.findOne({
      employee: req.user._id,
      status: "Approved",
      fromDate: { $lte: todayEnd },
      toDate: { $gte: todayStart },
    });

    if (approvedLeave) {
      return sendError(res, 400, "You already have approved leave for today.");
    }

    const attendance = new Attendance({
      employee: req.user._id,
      date: today,
      checkIn: new Date(),
      deviceIP,
      verificationStatus: isFlagged ? "Flagged" : "Verified",
      isFlagged,
      flagReason: isFlagged
        ? verification.reason === "ip_unavailable"
          ? "Unable to detect public IP"
          : "Check-in from unapproved network"
        : "",
      networkName: verification.network?.officeName || "",
    });

    await attendance.save();

    return sendSuccess(res, 200, {
      message: isFlagged
        ? "Checked in from an unapproved network and flagged for HR review."
        : "Check-In Succesfull",
      isFlagged,
      networkVerification: {
        authorized: verification.authorized,
        code: verification.reason,
        deviceIP,
        officeName: verification.network?.officeName || null,
      },
      attendance,
    });
  } catch (error) {
    return sendError(res, 500, "Attendance server error.");
  }
};

const checkOut = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const today = toDateKey();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });

    if (!attendance) {
      return sendError(res, 400, "Check In first");
    }

    if (attendance.checkOut) {
      return sendError(res, 400, "Already checked out today");
    }

    attendance.checkOut = new Date();

    const diff = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);

    attendance.workHours = diff;

    if (diff >= 8) attendance.status = "Present";
    else if (diff >= 4) attendance.status = "Half Day";
    else attendance.status = "Absent";

    await attendance.save();

    return sendSuccess(res, 200, {
      attendance,
      diff,
    });
  } catch (error) {
    return sendError(res, 500, "Attendance server error.");
  }
};

const getAttendance = async (req, res) => {
  try {
    if (!req.user?._id) {
      return sendError(res, 401, "Unauthorized request.");
    }

    const today = toDateKey();

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today,
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
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return sendError(res, 400, "Invalid year parameter.");
    }
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const attendance = await Attendance.find({
      employee: req.user._id,
      date: { $gte: start, $lte: end },
    });

    return sendSuccess(res, 200, {
      year,
      attendance,
    });
  } catch (error) {
    return sendError(res, 500, "Error fetching yearly attendance.");
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
    const records = await Attendance.find({ isFlagged: true })
      .populate("employee", "name email employeeId department")
      .sort({ createdAt: -1 })
      .limit(100);

    return sendSuccess(res, 200, {
      records,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch flagged attendance records.");
  }
};

export {
  checkIn,
  checkOut,
  getAttendance,
  getYearAttendance,
  verifyClockInNetwork,
  getFlaggedAttendance,
};
