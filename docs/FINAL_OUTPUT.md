# Final Project Output

Project name: PulsePeople HRMS
Repository: https://github.com/s-irlui/HRMS-

## Delivered Scope

PulsePeople HRMS now includes a responsive React portal and a Flask REST API scaffold aligned with the HRMS requirements.

## Functional Areas

- Authentication-ready login flow with demo roles.
- Role-based dashboards for Admin, HR Staff, Manager, and Employee.
- Employee record management with soft archive behavior.
- Sensitive salary and national ID visibility limited to Admin and HR Staff.
- Employee self-service profile updates for phone, address, and emergency contact.
- Department configuration for Admin.
- Leave request submission, approval, rejection, notifications, and leave balance updates.
- Attendance clock in/out and scoped attendance views.
- CSV reporting for leave and attendance with manager scoping.
- Admin-only audit log for write operations.
- Docker Compose setup for PostgreSQL, Flask, and React.

## Verification

- Flask backend syntax compiled successfully with WSL Python.
- Git working tree was checked before push.
- React build could not be executed in this environment because Node/npm are not installed in the available shell, although package files and lockfile are present.

## Run Commands

```bash
docker compose up --build
```

Or run separately:

```bash
cd backend
pip install -r requirements.txt
flask --app app run --debug
```

```bash
cd frontend
npm install
npm run dev
```
