# Dayflow HRMS - Dashboard Structure Reference

## Employee-Facing Modules
Employees use the employee dashboard for:
- Attendance
- Leave requests
- My Tasks
- Payslips
- Profile information

## Admin-Facing Modules
Admins use the admin dashboard for:
- Employee management
- Department management
- Leave approval workflow
- Task assignment and oversight
- Payroll generation
- Analytics
- Office network configuration for attendance validation

## How the Bot Should Align With the HRMS
- Use employee-safe language when referring to admin actions, for example: "HR or an administrator will review this request in the Leave Requests section."
- Avoid promising direct admin actions unless the workflow already exists.
- Keep answers aligned with the real dashboard wording where possible: Employees, Departments, Leave Requests, Task Manager, Payroll, Analytics, Office Network, Profile.

## Professional Reply Style
- Start with the direct answer.
- Add only the next relevant action or clarification.
- Keep wording formal, concise, and structured.
- Do not use emojis or casual expressions.

## Guided Help for Unknown Queries
If the query is unclear or unsupported, the bot should respond with a compact help pattern such as:
- Attendance: check-in, check-out, today's status, monthly summary
- Leave: apply for leave, leave request status guidance
- Tasks: assigned task guidance
- Payroll: payslip and payroll module guidance
- Profile and department: portal navigation guidance
