import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import PrivateRoutes from "./utils/PrivateRoutes";
import RoleBasedRoutes from "./utils/RoleBasedRoutes";
import StatCard from "./components/dashboard/StatCard";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

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
        <Route index element={<StatCard />}></Route>
        <Route path="departments" element={<Department />}></Route>
        <Route path="leaves" element={<AdminLeaves />}></Route>
        <Route path="add-new-department" element={<AddNewDepartment />}></Route>
        <Route path="departments/edit/:id" element={<EditDepartment />}></Route>
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
        <Route path="apply-for-leave" element={<ApplyForLeave />}></Route>
        <Route path="leave-request" element={<LeaveRequests />}></Route>
        <Route path="attendance" element={<Attendance />}></Route>
        <Route path="profile" element={<Profile />}></Route>
      </Route>
    </Routes>
  );
}

export default App;
