import Leave from "../models/Leave.js";

const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: "Required Field Missing",
      });
    }

    // ✅ Convert to Date objects
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // ✅ Check past date
    if (from < today) {
      return res.status(400).json({
        success: false,
        error: "Cannot apply leave for past dates",
      });
    }

    // ✅ Optional: toDate should not be before fromDate
    if (to < from) {
      return res.status(400).json({
        success: false,
        error: "Invalid date range",
      });
    }

    const overlappingLeave = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ["Pending", "Approved"] },
      fromDate: { $lte: to },
      toDate: { $gte: from },
    });

    if (overlappingLeave) {
      return res.status(409).json({
        success: false,
        error: "You already have a leave request for the selected dates",
      });
    }

    const leave = new Leave({
      employee: req.user._id,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    await leave.save();

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Apply leave server error",
    });
  }
};

const showLeave = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      leaves,
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
    const allLeaves = await Leave.find()
      .populate("employee", "name email employeeId department")
      .sort({ createdAt: -1 });

    const totalLeaves = await Leave.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });

    return res.status(200).json({
      success: true,
      allLeaves,
      totalLeaves,
      pendingLeaves,
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
    const { status } = req.body;
    const { id } = req.params;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Status",
      });
    }

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave not found",
      });
    }

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
