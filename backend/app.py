from datetime import date, datetime, timedelta
from functools import wraps
import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt, jwt_required
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()
db = SQLAlchemy()
SENSITIVE_ROLES = {"Admin", "HR Staff"}

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(160), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(40), nullable=False)
    active = db.Column(db.Boolean, default=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"))

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    lead = db.Column(db.String(120))

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False)
    phone = db.Column(db.String(40))
    address = db.Column(db.String(255))
    emergency_contact = db.Column(db.String(160))
    department_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    title = db.Column(db.String(120), nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey("employee.id"))
    employment_date = db.Column(db.Date, default=date.today)
    status = db.Column(db.String(40), default="Active")
    salary = db.Column(db.Numeric(12, 2))
    national_id = db.Column(db.String(80))
    leave_balance = db.Column(db.Integer, default=21)
    deleted_at = db.Column(db.DateTime)
    department = db.relationship("Department")
    def to_dict(self, include_sensitive=False):
        data = {"id": self.id, "name": self.name, "email": self.email, "phone": self.phone, "address": self.address, "emergencyContact": self.emergency_contact, "department": self.department.name if self.department else None, "departmentId": self.department_id, "title": self.title, "managerId": self.manager_id, "employmentDate": self.employment_date.isoformat(), "status": self.status, "leaveBalance": self.leave_balance}
        if include_sensitive:
            data.update({"salary": float(self.salary or 0), "nationalId": self.national_id})
        return data

class LeaveRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)
    leave_type = db.Column(db.String(80), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(40), default="Pending")
    reviewer_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    employee = db.relationship("Employee")

class AttendanceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)
    work_date = db.Column(db.Date, default=date.today)
    clock_in = db.Column(db.DateTime)
    clock_out = db.Column(db.DateTime)
    status = db.Column(db.String(40), default="Present")
    employee = db.relationship("Employee")

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer)
    action = db.Column(db.String(120), nullable=False)
    entity = db.Column(db.String(80), nullable=False)
    entity_id = db.Column(db.Integer)
    detail = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def role_required(*roles):
    def outer(fn):
        @wraps(fn)
        @jwt_required()
        def inner(*args, **kwargs):
            if get_jwt().get("role") not in roles:
                return {"error": "Insufficient permissions"}, 403
            return fn(*args, **kwargs)
        return inner
    return outer

def audit(action, entity, entity_id=None, detail=""):
    db.session.add(AuditLog(actor_id=get_jwt().get("user_id") if get_jwt() else None, action=action, entity=entity, entity_id=entity_id, detail=detail))

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///pulsepeople-dev.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret")
    CORS(app)
    JWTManager(app)
    db.init_app(app)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "name": "PulsePeople HRMS"}

    @app.post("/api/auth/login")
    def login():
        body = request.get_json() or {}
        user = User.query.filter_by(email=body.get("email"), active=True).first()
        if not user or not check_password_hash(user.password_hash, body.get("password", "")):
            return {"error": "Invalid credentials"}, 401
        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role, "employee_id": user.employee_id, "user_id": user.id})
        return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role, "employeeId": user.employee_id}}

    @app.get("/api/employees")
    @jwt_required()
    def employees_index():
        role = get_jwt().get("role")
        items = Employee.query.filter(Employee.deleted_at.is_(None)).order_by(Employee.name).all()
        return jsonify([item.to_dict(include_sensitive=role in SENSITIVE_ROLES) for item in items])

    @app.post("/api/employees")
    @role_required("Admin", "HR Staff")
    def employees_create():
        body = request.get_json() or {}
        employee = Employee(name=body["name"], email=body["email"], phone=body.get("phone"), department_id=body.get("departmentId"), title=body.get("title", "Team Member"), status=body.get("status", "Active"), salary=body.get("salary", 0), national_id=body.get("nationalId", ""), leave_balance=body.get("leaveBalance", 21))
        db.session.add(employee); db.session.flush(); audit("created employee", "Employee", employee.id, employee.name); db.session.commit()
        return employee.to_dict(include_sensitive=True), 201

    @app.delete("/api/employees/<int:employee_id>")
    @role_required("Admin", "HR Staff")
    def employees_delete(employee_id):
        employee = Employee.query.get_or_404(employee_id)
        employee.deleted_at = datetime.utcnow(); employee.status = "Deleted"
        audit("soft deleted employee", "Employee", employee.id, employee.name); db.session.commit()
        return {"status": "archived"}

    @app.get("/api/departments")
    @jwt_required()
    def departments_index():
        return jsonify([{"id": item.id, "name": item.name, "lead": item.lead} for item in Department.query.order_by(Department.name).all()])

    @app.post("/api/departments")
    @role_required("Admin")
    def departments_create():
        body = request.get_json() or {}; department = Department(name=body["name"], lead=body.get("lead"))
        db.session.add(department); db.session.flush(); audit("created department", "Department", department.id, department.name); db.session.commit()
        return {"id": department.id, "name": department.name, "lead": department.lead}, 201

    @app.get("/api/leave")
    @jwt_required()
    def leave_index():
        rows = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
        return jsonify([{"id": r.id, "employeeId": r.employee_id, "employee": r.employee.name, "type": r.leave_type, "start": r.start_date.isoformat(), "end": r.end_date.isoformat(), "reason": r.reason, "status": r.status} for r in rows])

    @app.post("/api/leave")
    @jwt_required()
    def leave_create():
        body = request.get_json() or {}
        row = LeaveRequest(employee_id=get_jwt().get("employee_id"), leave_type=body["type"], start_date=date.fromisoformat(body["start"]), end_date=date.fromisoformat(body["end"]), reason=body.get("reason", ""))
        db.session.add(row); db.session.flush(); audit("submitted leave", "LeaveRequest", row.id); db.session.commit()
        return {"id": row.id, "status": row.status}, 201

    @app.patch("/api/leave/<int:request_id>")
    @role_required("Admin", "HR Staff", "Manager")
    def leave_decide(request_id):
        row = LeaveRequest.query.get_or_404(request_id); row.status = (request.get_json() or {}).get("status", "Pending"); row.reviewer_id = get_jwt().get("user_id")
        audit(f"{row.status.lower()} leave", "LeaveRequest", row.id); db.session.commit()
        return {"id": row.id, "status": row.status}

    @app.post("/api/attendance/clock")
    @jwt_required()
    def attendance_clock():
        employee_id = get_jwt().get("employee_id")
        current = AttendanceRecord.query.filter_by(employee_id=employee_id, work_date=date.today()).first()
        if not current:
            current = AttendanceRecord(employee_id=employee_id, clock_in=datetime.utcnow()); db.session.add(current); action = "clocked in"
        else:
            current.clock_out = datetime.utcnow(); action = "clocked out"
        audit(action, "AttendanceRecord", current.id); db.session.commit()
        return {"id": current.id, "status": current.status}

    @app.get("/api/attendance")
    @jwt_required()
    def attendance_index():
        rows = AttendanceRecord.query.order_by(AttendanceRecord.work_date.desc()).all()
        return jsonify([{"id": r.id, "employeeId": r.employee_id, "employee": r.employee.name, "date": r.work_date.isoformat(), "clockIn": r.clock_in.isoformat() if r.clock_in else None, "clockOut": r.clock_out.isoformat() if r.clock_out else None, "status": r.status} for r in rows])

    @app.get("/api/reports/<kind>.csv")
    @role_required("Admin", "HR Staff", "Manager")
    def reports_csv(kind):
        if kind == "leave":
            rows = ["id,employee,type,start,end,status"] + [f"{r.id},{r.employee.name},{r.leave_type},{r.start_date},{r.end_date},{r.status}" for r in LeaveRequest.query.all()]
        else:
            rows = ["id,employee,date,clock_in,clock_out,status"] + [f"{r.id},{r.employee.name},{r.work_date},{r.clock_in},{r.clock_out},{r.status}" for r in AttendanceRecord.query.all()]
        return Response("\n".join(rows), mimetype="text/csv")

    @app.get("/api/audit")
    @role_required("Admin")
    def audit_index():
        rows = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
        return jsonify([{"id": r.id, "action": r.action, "entity": r.entity, "entityId": r.entity_id, "detail": r.detail, "createdAt": r.created_at.isoformat()} for r in rows])

    with app.app_context():
        db.create_all(); seed()
    return app



def seed():
    if User.query.first():
        return
    departments = [
        Department(name="People Operations", lead="Maya Reed"),
        Department(name="Engineering", lead="Noah Kim"),
        Department(name="Sales", lead="Ava Stone"),
        Department(name="Finance", lead="Ivy Chen"),
    ]
    db.session.add_all(departments); db.session.flush()
    employees = [
        Employee(name="Maya Reed", email="hr@pulsepeople.test", phone="+1 202 555 0144", department_id=departments[0].id, title="HR Lead", salary=82000, national_id="HR-2145", leave_balance=18),
        Employee(name="Noah Kim", email="manager@pulsepeople.test", phone="+1 202 555 0181", department_id=departments[1].id, title="Engineering Manager", salary=108000, national_id="EN-7741", leave_balance=14),
        Employee(name="Lena Brooks", email="employee@pulsepeople.test", phone="+1 202 555 0117", department_id=departments[1].id, title="Product Designer", manager_id=2, salary=76000, national_id="DS-5933", leave_balance=16),
        Employee(name="Mateo Cruz", email="mateo@pulsepeople.test", phone="+1 202 555 0188", department_id=departments[2].id, title="Account Executive", manager_id=2, salary=69000, national_id="SL-8321", leave_balance=21),
    ]
    db.session.add_all(employees); db.session.flush()
    users = [("admin@pulsepeople.test", "Admin", employees[0].id), ("hr@pulsepeople.test", "HR Staff", employees[0].id), ("manager@pulsepeople.test", "Manager", employees[1].id), ("employee@pulsepeople.test", "Employee", employees[2].id)]
    for email, role, employee_id in users:
        db.session.add(User(email=email, role=role, employee_id=employee_id, password_hash=generate_password_hash("password123")))
    db.session.add(LeaveRequest(employee_id=employees[2].id, leave_type="Annual", start_date=date.today() + timedelta(days=5), end_date=date.today() + timedelta(days=7), reason="Family travel"))
    db.session.add(AttendanceRecord(employee_id=employees[2].id, work_date=date.today(), clock_in=datetime.utcnow(), status="Present"))
    db.session.commit()
app = create_app()
