# PulsePeople HRMS

PulsePeople HRMS is a modern human resource management portal for small and medium-sized organizations. It centralizes employee records, leave approvals, attendance, reporting, notifications, and role-aware dashboards.

## Stack

- Frontend: React, Vite, React Context
- Backend: Flask, Flask-JWT-Extended, SQLAlchemy
- Database: PostgreSQL through DATABASE_URL
- UI: responsive custom CSS

## Demo Login

Use the role and user switchers inside the frontend to preview Admin, HR Staff, Manager, and Employee access. Backend seed accounts all use `password123`.

- admin@pulsepeople.test
- hr@pulsepeople.test
- manager@pulsepeople.test
- employee@pulsepeople.test

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Run Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask --app app run --debug
```

## Branch Plan

- feature/frontend-shell
- feature/backend-api
- feature/rbac-auth
- feature/employee-records
- feature/leave-management
- feature/attendance-tracking
- feature/reports-notifications
- feature/mobile-polish

## Docker Run

```bash
docker compose up --build
```

Frontend: http://localhost:5173
Backend: http://localhost:5000/api/health

## Delivered Features

- Demo login screen for Admin, HR Staff, Manager, and Employee sessions.
- Role-aware navigation and dashboards.
- Employee onboarding, search, sensitive-field protection, and soft archive.
- Self-service profile page for contact updates.
- Leave request submission, manager/HR approval, rejection, notifications, and balance updates.
- Attendance clock in/out and scoped attendance tables.
- Department configuration for Admin.
- Leave and attendance CSV reports with manager scoping.
- Admin audit log for write operations.
- Docker Compose setup for PostgreSQL, Flask API, and React frontend.
