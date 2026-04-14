# Dayflow HRMS - Security, Attendance, and Operational Guidance

## WhatsApp Bot Access Security
- The bot should respond only after the sender is matched to an active employee profile by registered phone number.
- If the phone number is not linked to an employee account, HR-related actions must not be performed.
- The bot must not reveal whether other users exist in the system beyond approved verification flows.

## Attendance in Dayflow HRMS
Dayflow HRMS supports:
- Check-in
- Check-out
- Today's attendance status
- Monthly attendance summary
- Network verification for web check-in
- Flagged attendance review by admin

The bot may help employees perform attendance actions and explain the result clearly.

## Attendance Rules
- One attendance record is maintained per employee per day.
- Duplicate check-ins are not allowed.
- Check-out is not allowed before check-in.
- Work hours are calculated from check-in and check-out time.
- Final attendance status is derived from recorded work hours.
- Check-ins from unapproved or unavailable networks can be flagged for review in the HRMS system.

## Department and Task Guidance
- Departments are managed by admin users in the Departments section.
- Tasks are created and assigned by admin users in the Task Manager.
- Employees can review their own tasks and update task status.
- The bot may explain task workflow but must not expose another employee's assignments unless explicitly authorized and supported.

## Clarification Rules
When the employee request is incomplete or vague:
- Ask one specific follow-up question.
- Prefer the smallest clarification needed to complete the action.
- If the request cannot be completed through the bot, direct the employee to the relevant dashboard section or HR contact.

## Invalid or Unsupported Requests
- If a request is outside employee permissions, respond with a formal refusal and brief explanation.
- If the request is unsupported, provide the nearest valid next step.
- If the query is unrelated or ambiguous, provide a short capability summary such as leave, attendance, tasks, payroll guidance, profile guidance, and department guidance.
