import React from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate, NavLink } from "react-router-dom";
import { SquaresFour, ClipboardText, CalendarCheck, CalendarBlank, UserCircle, SignOut, Lightning, Wallet, CaretLeft, CaretRight } from "@phosphor-icons/react";
import API_BASE_URL from "../../config/api.js";

const EmployeeNavbar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };

  const navItems = [
    { to: "/employee-dashboard", icon: SquaresFour, label: "Dashboard", end: true },
    { to: "/employee-dashboard/tasks", icon: ClipboardText, label: "My Tasks" },
    { to: "/employee-dashboard/attendance", icon: CalendarCheck, label: "Attendance" },
    { to: "/employee-dashboard/leave-request", icon: CalendarBlank, label: "Leave" },
    { to: "/employee-dashboard/payroll", icon: Wallet, label: "Payslips" },
    { to: "/employee-dashboard/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <aside className={`h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-border)] fixed left-0 top-0 flex flex-col z-[60] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isCollapsed ? 'w-[80px]' : 'w-64'}`}>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 bg-white border border-[var(--color-border)] text-slate-500 rounded-full p-1.5 hover:text-slate-800 hover:bg-slate-50 hover:shadow-md transition-all z-[70] cursor-pointer shadow-sm"
      >
        {isCollapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
      </button>

      {/* Brand */}
      <div className={`p-6 pb-5 border-b border-[var(--color-border)] flex flex-col gap-1.5 overflow-hidden ${isCollapsed ? 'items-center px-0' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src="/logo-full.png" alt="DayFlow HRMS" className="h-[34px] object-contain self-start -ml-1 transition-opacity duration-300" />
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1 whitespace-nowrap">Employee Portal</p>
          </>
        ) : (
          <div className="w-[34px] h-[34px] bg-[var(--color-sidebar)] border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
            <img src="/logo-full.png" alt="Icon" className="h-[20px] object-contain object-left overflow-hidden w-[20px]" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed && <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[1px] px-2 pb-2">Menu</p>}
        <div className="flex flex-col space-y-[4px]">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} 
              className={({ isActive }) => `
                flex items-center gap-3 py-2.5 rounded-[var(--radius-sm)] text-[13.5px] transition-all duration-200 border
                ${isActive 
                  ? "bg-[var(--color-accent-bg)] text-[var(--color-text-primary)] font-medium border-indigo-100/50 shadow-sm" 
                  : "text-[var(--color-text-secondary)] border-transparent hover:bg-slate-50"}
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
              `}>
              {({ isActive }) => (
                <>
                  <Icon size={isCollapsed ? 20 : 18} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap tracking-wide overflow-hidden">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-[var(--color-border)] ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-page)] mb-3 border border-[var(--color-border)] ${isCollapsed ? 'justify-center bg-transparent border-transparent' : ''}`}>
          {user?.profileImage ? (
            <img 
              src={user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE_URL}/${user.profileImage}`} 
              alt="Profile" 
              className={`rounded shrink-0 object-cover border border-[var(--color-border)] ${isCollapsed ? 'w-10 h-10 shadow-sm' : 'w-8 h-8'}`}
            />
          ) : (
            <div className={`rounded shrink-0 bg-slate-800 flex items-center justify-center font-bold text-white ${isCollapsed ? 'w-10 h-10 text-[15px]' : 'w-8 h-8 text-[13px]'}`}>
              {(user?.name || "E").charAt(0).toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{user?.name || "Employee"}</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">Team Member</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} 
          className={`flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 text-red-600 text-[13px] font-medium transition-colors hover:bg-red-100 cursor-pointer ${isCollapsed ? 'w-10 h-10 mx-auto' : 'w-full px-3 py-2'}`}>
          <SignOut size={16} weight="bold" className="shrink-0" /> {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default EmployeeNavbar;
