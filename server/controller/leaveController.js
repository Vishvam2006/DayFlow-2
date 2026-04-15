import Leave from "../models/Leave.js";
import { createLeaveRequest } from "../services/leaveService.js";
import { updateLeaveStatusAndQueueNotification } from "../services/leaveNotificationService.js";
import { buildPaginationMeta, escapeRegex, parsePagination } from "../utils/pagination.js";
import { queueEmail, sendLeaveStatusUpdate } from "../services/email/emailService.js";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: "Required Field Missing",
      });
    }

    const leave = await createLeaveRequest({
      employeeId: req.user._id,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : "Apply leave server error",
    });
  }
};

const showLeave = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 10,
      maxLimit: 100,
    });
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const filter = {
      employee: req.user._id,
      ...(status && status !== "All" ? { status } : {}),
    };

    const [leaves, totalItems] = await Promise.all([
      Leave.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Leave.countDocuments(filter),
    ]);
    const pagination = buildPaginationMeta({ page, limit, totalItems });

    return res.status(200).json({
      success: true,
      leaves,
      ...pagination,
      filters: {
        status: status || "All",
      },
    });
  } catch (error) {
    console.error("SHOW LEAVE ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Fetch leave server error",
    });
  }
};

const allLeaveRequests = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 10,
      maxLimit: 100,
    });
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const employeeLookup = q
      ? {
          $or: [
            { "employee.name": { $regex: escapeRegex(q), $options: "i" } },
            { "employee.email": { $regex: escapeRegex(q), $options: "i" } },
            { "employee.employeeId": { $regex: escapeRegex(q), $options: "i" } },
            { "employee.department": { $regex: escapeRegex(q), $options: "i" } },
            { leaveType: { $regex: escapeRegex(q), $options: "i" } },
          ],
        }
      : {};

    const baseFilter = status && status !== "All" ? { status } : {};

    const [result, totalLeaves, pendingLeaves] = await Promise.all([
      Leave.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "employee",
            foreignField: "_id",
            as: "employee",
          },
        },
        {
          $unwind: {
            path: "$employee",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            ...baseFilter,
            ...employeeLookup,
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            items: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  leaveType: 1,
                  fromDate: 1,
                  toDate: 1,
                  reason: 1,
                  status: 1,
                  decisionComment: 1,
                  appliedAt: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  employee: {
                    _id: "$employee._id",
                    name: "$employee.name",
                    email: "$employee.email",
                    employeeId: "$employee.employeeId",
                    department: "$employee.department",
                  },
                },
              },
            ],
            meta: [{ $count: "totalItems" }],
          },
        },
      ]),
      Leave.countDocuments(),
      Leave.countDocuments({ status: "Pending" }),
    ]);

    const allLeaves = result?.[0]?.items || [];
    const totalItems = result?.[0]?.meta?.[0]?.totalItems || 0;
    const pagination = buildPaginationMeta({ page, limit, totalItems });

    return res.status(200).json({
      success: true,
      allLeaves,
      totalLeaves,
      pendingLeaves,
      ...pagination,
      filters: {
        status: status || "All",
        q,
      },
    });
  } catch (error) {
    console.error("SHOW LEAVE ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Fetch leave server error",
    });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { status, decisionComment, reason } = req.body;
    const { id } = req.params;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Status",
      });
    }

    const leave = await updateLeaveStatusAndQueueNotification({
      leaveId: id,
      status,
      decisionComment: decisionComment ?? reason ?? "",
    });

    queueEmail("leave-status-update", () =>
      sendLeaveStatusUpdate({
        email: leave.employee?.email,
        employeeName: leave.employee?.name || "Employee",
        status,
        leaveType: leave.leaveType,
        fromDate: formatDate(leave.fromDate),
        toDate: formatDate(leave.toDate),
        decisionComment: leave.decisionComment || "",
        dashboardUrl: process.env.EMPLOYEE_DASHBOARD_URL || process.env.APP_URL || "",
      })
    );

    return res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      leave,
    });
  } catch (error) {
    console.error("UPDATE LEAVE STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Update leave server error",
    });
  }
};

const getMyPendingLeaves = async (req, res) => {
  try {
    const count = await Leave.countDocuments({
      employee: req.user._id,
      status: "Pending",
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("PENDING COUNT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending leave count",
    });
  }
};

export {
  applyLeave,
  showLeave,
  allLeaveRequests,
  updateLeaveStatus,
  getMyPendingLeaves,
};
