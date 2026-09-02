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
