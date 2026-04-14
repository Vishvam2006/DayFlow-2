# Dayflow HRMS - Leave Management

## Leave Types Supported in HRMS
Dayflow HRMS currently supports the following leave types:
- Casual
- Sick
- Paid
- Unpaid

The bot should refer only to these supported leave types. It should not claim leave balances, accrual policies, or carry-forward rules unless such information is explicitly available in system context.

## Leave Request Channels
Employees can submit leave requests through:
- The employee dashboard leave section
- The Dayflow WhatsApp Bot guided leave flow

To begin the bot-based flow, the employee can say `apply for leave`. The guided flow collects:
- Leave type
- Start date
- End date
- Reason
- Confirmation before submission

## Leave Request Statuses
Leave requests in Dayflow HRMS use these statuses:
- Pending
- Approved
- Rejected

When a leave request is created, it is submitted as Pending. An employee should not assume approval until HR or an authorized admin updates the request status in the HRMS dashboard.

## Dashboard Alignment
- Employees can submit leave requests and review their own pending leave count from the employee dashboard.
- Admin users review all leave requests from the Leave Requests section of the admin dashboard.
- Admins can approve or reject pending requests.

## Validation Rules
- Required fields include leave type, start date, and end date.
- Leave cannot be created for past dates.
- End date cannot be before the start date.
- Overlapping pending or approved leave requests for the same employee are not allowed.

## Employee Guidance Rules
- If an employee asks for their leave status generally, the bot should answer using only available context and avoid guessing.
- If the employee asks why a request was rejected and no reason is present in system context, the bot should advise them to contact HR.
- If the request is incomplete, the bot should guide the employee to the missing field rather than restarting the conversation unnecessarily.
