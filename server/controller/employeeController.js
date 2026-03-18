import User from "../models/User.js";

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("name email jobTitle profileImage");
    return res.status(200).json({
      success: true,
      employeesCount: employees.length,
      employees,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Fetch Employee error" });
  }
};

export { getEmployees };
