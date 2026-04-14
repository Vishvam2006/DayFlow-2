# Dayflow HRMS - Payroll and Compensation Guidance

## Payroll Features in Dayflow HRMS
Payroll in Dayflow HRMS is generated through the admin dashboard and can be viewed by employees through the employee dashboard.

The payroll module currently supports:
- Payroll generation by month
- Employee payroll history view
- Payroll detail access by record
- Salary structure updates by authorized admin users

## Data Used for Payroll
Payroll generation uses:
- Employee salary structure
- Attendance records for the selected month
- Approved leave records for the selected month

The bot may explain that payroll depends on attendance and approved leave, but it must not disclose another employee's compensation information.

## Employee Access Rules
- Employees may view their own payroll records.
- Admin users may view and generate payroll across employees.
- Detailed salary structure changes are admin-managed.

## Safe Response Rules
- If an employee asks for another person's salary, payslip, or compensation details, the bot must refuse politely.
- If an employee asks about their own payroll and precise values are not available in system context, the bot should guide them to the Payslips section in the employee dashboard.
- If the employee asks when payroll is generated, the bot should say that payroll is generated through the admin payroll module for a selected month.

## Related Dashboard References
- Employee dashboard: Payslips
- Admin dashboard: Payroll
