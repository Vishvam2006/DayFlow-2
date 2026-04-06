import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import OtpLogin from "./pages/OtpLogin";
import VerifyOtp from "./pages/VerifyOtp";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import PrivateRoutes from "./utils/PrivateRoutes";
import RoleBasedRoutes from "./utils/RoleBasedRoutes";
import Department from "./components/department/Department";
import DashboardHome from "./components/dashboard/DashboardHome";
import AddNewDepartment from "./components/department/AddNewDepartment";
import EditDepartment from "./components/department/EditDepartment";
import ApplyForLeave from "./components/employee/ApplyForLeave";
import EmployeeHome from "./components/employee/EmployeeHome";
import LeaveRequests from "./components/employee/LeaveRequests";
import Attendance from "./components/employee/Attendance";
import Profile from "./components/employee/Profile";
import AdminLeaves from "./components/AdminLeave/AdminLeave";
import AdminTaskManager from "./components/tasks/AdminTaskManager";
import EmployeeTaskBoard from "./components/tasks/EmployeeTaskBoard";
import EmployeeManagement from "./components/employee/EmployeeManagement";
import AdminPayroll from "./components/payroll/AdminPayroll";
import EmployeePayroll from "./components/payroll/EmployeePayroll";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/otp" element={<OtpLogin />} />
      <Route path="/login/otp/verify" element={<VerifyOtp />} />

      <Route
        path="/admin-dashboard"
        element={
          <PrivateRoutes>
            <RoleBasedRoutes requiredRole={["admin"]}>
              <AdminDashboard />
            </RoleBasedRoutes>
          </PrivateRoutes>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="departments" element={<Department />} />
        <Route path="leaves" element={<AdminLeaves />} />
        <Route path="add-new-department" element={<AddNewDepartment />} />
        <Route path="departments/edit/:id" element={<EditDepartment />} />
        <Route path="tasks" element={<AdminTaskManager />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="payroll" element={<AdminPayroll />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/employee-dashboard"
        element={
          <PrivateRoutes>
            <RoleBasedRoutes requiredRole={["employee"]}>
              <EmployeeDashboard />
            </RoleBasedRoutes>
          </PrivateRoutes>
        }
      >
        <Route index element={<EmployeeHome />} />
        <Route path="tasks" element={<EmployeeTaskBoard />} />
        <Route path="apply-for-leave" element={<ApplyForLeave />} />
        <Route path="leave-request" element={<LeaveRequests />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="payroll" element={<EmployeePayroll />} />
      </Route>
    </Routes>
  );
}

export default App;
