# PulsePeople HRMS API

Base URL: `/api`

## Authentication

- `POST /auth/login` returns a JWT and user profile.
- `GET /auth/me` returns the authenticated user and linked employee profile.

## Admin User Management

- `GET /users` lists accounts. Admin only.
- `PATCH /users/:id` updates role, active status, linked employee, or password. Admin only.

## Employees

- `GET /employees` returns scoped employees based on role.
- `POST /employees` creates employee records. Admin and HR Staff only.
- `PATCH /employees/:id` updates employee records. Employees may update only contact fields on their own record.
- `DELETE /employees/:id` soft deletes employee records. Admin and HR Staff only.

## Departments

- `GET /departments` lists departments.
- `POST /departments` creates departments. Admin only.

## Leave

- `GET /leave` returns scoped leave requests.
- `POST /leave` submits a leave request for the authenticated employee.
- `PATCH /leave/:id` approves or rejects leave. Admin, HR Staff, and scoped Managers only.

## Attendance

- `POST /attendance/clock` clocks the authenticated employee in or out.
- `GET /attendance` returns scoped attendance records.

## Reporting And Audit

- `GET /reports/leave.csv` exports leave data. Admin, HR Staff, Manager.
- `GET /reports/attendance.csv` exports attendance data. Admin, HR Staff, Manager.
- `GET /audit` lists write events. Admin only.
