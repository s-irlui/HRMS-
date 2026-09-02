import React, { createContext, useContext, useMemo, useState } from "react";
import { initialAttendance, initialEmployees, initialLeave, roles, sensitiveRoles, timeNow, today, uid } from "./data";

const Store = createContext(null);
const useStore = () => useContext(Store);
const employeeName = (id, employees) => employees.find((employee) => employee.id === id)?.name || "Unknown";

function StoreProvider({ children }) {
  const [role, setRole] = useState("Admin");
  const [activeUserId, setActiveUserId] = useState(1);
  const [employees, setEmployeesState] = useState(() => JSON.parse(localStorage.getItem("pp.employees") || "null") || initialEmployees);
  const [leave, setLeaveState] = useState(() => JSON.parse(localStorage.getItem("pp.leave") || "null") || initialLeave);
  const [attendance, setAttendanceState] = useState(() => JSON.parse(localStorage.getItem("pp.attendance") || "null") || initialAttendance);
  const [departments, setDepartments] = useState(["People Operations", "Engineering", "Sales", "Finance"]);
  const [audit, setAudit] = useState([{ id: uid(), actor: "System", action: "Demo workspace seeded", when: "2026-09-02 08:00" }]);
  const [notifications, setNotifications] = useState([{ id: uid(), text: "Annual leave request is waiting for manager review.", unread: true }]);
  const currentEmployee = employees.find((employee) => employee.id === activeUserId) || employees[0];
  const scopeEmployees = useMemo(() => {
    if (["Admin", "HR Staff"].includes(role)) return employees.filter((employee) => employee.status !== "Deleted");
    if (role === "Manager") return employees.filter((employee) => employee.managerId === currentEmployee.id || employee.id === currentEmployee.id);
    return employees.filter((employee) => employee.id === currentEmployee.id);
  }, [employees, role, currentEmployee.id]);
  const persist = (key, setter) => (value) => { setter(value); localStorage.setItem(key, JSON.stringify(value)); };
  const log = (action) => setAudit((items) => [{ id: uid(), actor: role, action, when: new Date().toLocaleString() }, ...items]);
  return <Store.Provider value={{ role, setRole, roles, activeUserId, setActiveUserId, currentEmployee, employees, setEmployees: persist("pp.employees", setEmployeesState), leave, setLeave: persist("pp.leave", setLeaveState), attendance, setAttendance: persist("pp.attendance", setAttendanceState), departments, setDepartments, audit, log, notifications, setNotifications, scopeEmployees }}>{children}</Store.Provider>;
}

function Stat({ label, value, detail }) { return <article className="stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }

function LoginScreen({ onLogin }) {
  const { role, setRole, activeUserId, setActiveUserId, employees } = useStore();
  return <main className="login-page"><section className="login-hero"><div><p>PulsePeople HRMS</p><h1>One calm place for people operations.</h1><span>Secure records, approvals, attendance, reporting, and self-service in a role-aware portal.</span></div></section><form className="login-box" onSubmit={(event) => { event.preventDefault(); onLogin(); }}><h2>Sign in</h2><label>Demo role</label><select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select><label>Demo user</label><select value={activeUserId} onChange={(event) => setActiveUserId(Number(event.target.value))}>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select><input value="password123" readOnly aria-label="Demo password" /><button>Enter workspace</button></form></main>;
}
function Shell({ view, setView }) {
  const { role, setRole, activeUserId, setActiveUserId, employees, notifications } = useStore();
  const [authenticated, setAuthenticated] = useState(false);
  const nav = ["Dashboard", "Profile", "Employees", "Leave", "Attendance", "Departments", "Reports", "Audit"];
  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span>PP</span><div><strong>PulsePeople</strong><small>HRMS command center</small></div></div><nav>{nav.map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}</nav><div className="login-card"><label>Role</label><select value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select><label>User</label><select value={activeUserId} onChange={(event) => setActiveUserId(Number(event.target.value))}>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></div></aside><main><header className="topbar"><div><p>Role aware workspace</p><h1>{view}</h1></div><div className="status-pill">{notifications.filter((note) => note.unread).length} unread alerts</div></header>{view === "Dashboard" && <Dashboard />}{view === "Profile" && <Profile />}{view === "Employees" && <Employees />}{view === "Leave" && <Leave />}{view === "Attendance" && <Attendance />}{view === "Departments" && <Departments />}{view === "Reports" && <Reports />}{view === "Audit" && <Audit />}</main></div>;
}

function Dashboard() {
  const { role, currentEmployee, employees, leave, attendance, notifications, setNotifications, scopeEmployees } = useStore();
  const pending = leave.filter((item) => item.status === "Pending").length;
  const present = attendance.filter((item) => item.date === "2026-09-02" && item.in).length;
  return <section className="grid dashboard-grid"><div className="hero-panel"><div><p>{role} dashboard</p><h2>Welcome back, {currentEmployee.name.split(" ")[0]}.</h2><span>Manage people data, approvals, attendance, and reporting from one responsive portal.</span></div></div><div className="stats-row"><Stat label="Headcount" value={scopeEmployees.length} detail="visible in your permission scope" /><Stat label="Pending leave" value={pending} detail="awaiting decision" /><Stat label="Clocked in" value={present} detail="today" /><Stat label="Leave balance" value={currentEmployee.leaveBalance} detail="days remaining" /></div><section className="panel"><h3>Live Notifications</h3>{notifications.map((note) => <div className="notification" key={note.id}><span>{note.text}</span><button onClick={() => setNotifications(notifications.map((item) => item.id === note.id ? { ...item, unread: false } : item))}>Mark read</button></div>)}</section><section className="panel"><h3>Today At A Glance</h3><div className="timeline">{attendance.slice(0, 4).map((record) => <div key={record.id}><b>{employeeName(record.employeeId, employees)}</b><span>{record.status} {record.in ? `from ${record.in}` : "not clocked"}</span></div>)}</div></section></section>;
}
function Profile() {
  const { currentEmployee, employees, setEmployees, role, log } = useStore();
  const [draft, setDraft] = useState({ phone: currentEmployee.phone || "", address: currentEmployee.address || "", emergency: currentEmployee.emergency || "" });
  const save = (event) => {
    event.preventDefault();
    setEmployees(employees.map((employee) => employee.id === currentEmployee.id ? { ...employee, ...draft } : employee));
    log(`Updated self-service profile for ${currentEmployee.name}`);
  };
  return <section className="split-layout"><div className="panel profile-panel"><h3>My Profile</h3><div className="profile-cover"><strong>{currentEmployee.name}</strong><span>{currentEmployee.title} / {currentEmployee.department}</span></div><div className="profile-grid"><span>Email</span><b>{currentEmployee.email}</b><span>Status</span><b>{currentEmployee.status}</b><span>Start date</span><b>{currentEmployee.startDate}</b><span>Leave balance</span><b>{currentEmployee.leaveBalance} days</b>{sensitiveRoles.has(role) && <><span>Salary</span><b>${currentEmployee.salary.toLocaleString()}</b><span>National ID</span><b>{currentEmployee.nationalId}</b></>}</div></div><form className="panel form-panel" onSubmit={save}><h3>Self-Service Updates</h3><input placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /><input placeholder="Address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /><input placeholder="Emergency contact" value={draft.emergency} onChange={(e) => setDraft({ ...draft, emergency: e.target.value })} /><button>Save profile</button><small>Employees can update contact details only. HR/Admin manage employment fields.</small></form></section>;
}
function Employees() {
  const { role, employees, setEmployees, departments, log, scopeEmployees } = useStore();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", department: departments[0], title: "", status: "Active" });
  const canWrite = ["Admin", "HR Staff"].includes(role);
  const visible = scopeEmployees.filter((employee) => `${employee.name} ${employee.department} ${employee.title}`.toLowerCase().includes(query.toLowerCase()));
  const addEmployee = (event) => {
    event.preventDefault();
    if (!canWrite || !draft.name || !draft.email) return;
    const next = { ...draft, id: Date.now(), managerId: null, startDate: today(), salary: 0, nationalId: "", leaveBalance: 21, address: "", emergency: "" };
    setEmployees([next, ...employees]);
    setDraft({ name: "", email: "", phone: "", department: departments[0], title: "", status: "Active" });
    log(`Created employee profile for ${next.name}`);
  };
  const softDelete = (id) => { setEmployees(employees.map((employee) => employee.id === id ? { ...employee, status: "Deleted" } : employee)); log(`Soft deleted employee #${id}`); };
  return <section className="split-layout"><div className="panel"><div className="section-head"><h3>Employee Records</h3><input placeholder="Search people" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Status</th>{sensitiveRoles.has(role) && <th>Salary</th>}<th></th></tr></thead><tbody>{visible.map((employee) => <tr key={employee.id}><td><strong>{employee.name}</strong><small>{employee.email}</small></td><td>{employee.department}</td><td>{employee.title}</td><td><span className="badge">{employee.status}</span></td>{sensitiveRoles.has(role) && <td>${employee.salary.toLocaleString()}</td>}<td>{canWrite && <button onClick={() => softDelete(employee.id)}>Archive</button>}</td></tr>)}</tbody></table></div></div><form className="panel form-panel" onSubmit={addEmployee}><h3>Onboard Employee</h3><input placeholder="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} disabled={!canWrite} /><input placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} disabled={!canWrite} /><input placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} disabled={!canWrite} /><select value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} disabled={!canWrite}>{departments.map((item) => <option key={item}>{item}</option>)}</select><input placeholder="Job title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} disabled={!canWrite} /><button disabled={!canWrite}>Create profile</button>{!canWrite && <small>Managers and employees have read-only access here.</small>}</form></section>;
}

function Leave() {
  const { role, currentEmployee, employees, setEmployees, leave, setLeave, setNotifications, notifications, log, scopeEmployees } = useStore();
  const [draft, setDraft] = useState({ type: "Annual", start: today(), end: today(), reason: "" });
  const allowedIds = new Set(scopeEmployees.map((employee) => employee.id));
  const visible = ["Admin", "HR Staff"].includes(role) ? leave : role === "Manager" ? leave.filter((item) => allowedIds.has(item.employeeId)) : leave.filter((item) => item.employeeId === currentEmployee.id);
  const submit = (event) => { event.preventDefault(); const next = { ...draft, id: Date.now(), employeeId: currentEmployee.id, status: "Pending" }; setLeave([next, ...leave]); setNotifications([{ id: uid(), text: `${currentEmployee.name} submitted ${draft.type} leave.`, unread: true }, ...notifications]); log(`Submitted leave request #${next.id}`); };
  const decide = (id, status) => { const request = leave.find((item) => item.id === id); setLeave(leave.map((item) => item.id === id ? { ...item, status } : item)); if (status === "Approved") { const days = Math.max(1, Math.round((new Date(request.end) - new Date(request.start)) / 86400000) + 1); setEmployees(employees.map((employee) => employee.id === request.employeeId ? { ...employee, leaveBalance: Math.max(0, employee.leaveBalance - days) } : employee)); } setNotifications([{ id: uid(), text: `${employeeName(request.employeeId, employees)} leave ${status.toLowerCase()}.`, unread: true }, ...notifications]); log(`${status} leave request #${id}`); };
  return <section className="split-layout"><form className="panel form-panel" onSubmit={submit}><h3>Request Leave</h3><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option>Annual</option><option>Sick</option><option>Study</option><option>Unpaid</option></select><input type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} /><input type="date" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} /><textarea placeholder="Reason" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} /><button>Submit request</button></form><div className="panel"><h3>Approval Queue</h3><div className="cards-list">{visible.map((item) => <article className="mini-card" key={item.id}><div><strong>{employeeName(item.employeeId, employees)}</strong><span>{item.type}: {item.start} to {item.end}</span><small>{item.reason}</small></div><b className={`state ${item.status.toLowerCase()}`}>{item.status}</b>{item.status === "Pending" && role !== "Employee" && <div className="actions"><button onClick={() => decide(item.id, "Approved")}>Approve</button><button onClick={() => decide(item.id, "Rejected")}>Reject</button></div>}</article>)}</div></div></section>;
}

function Attendance() {
  const { role, currentEmployee, employees, attendance, setAttendance, log, scopeEmployees } = useStore();
  const ids = new Set(scopeEmployees.map((employee) => employee.id));
  const visible = ["Admin", "HR Staff"].includes(role) ? attendance : role === "Manager" ? attendance.filter((item) => ids.has(item.employeeId)) : attendance.filter((item) => item.employeeId === currentEmployee.id);
  const active = attendance.find((item) => item.employeeId === currentEmployee.id && item.date === today());
  const clock = () => { if (!active) { setAttendance([{ id: Date.now(), employeeId: currentEmployee.id, date: today(), in: timeNow(), out: "", status: "Present" }, ...attendance]); log(`${currentEmployee.name} clocked in`); } else { setAttendance(attendance.map((item) => item.id === active.id ? { ...item, out: timeNow() } : item)); log(`${currentEmployee.name} clocked out`); } };
  return <section className="grid"><div className="panel attendance-hero"><h3>Personal Clock</h3><strong>{active?.in || "--:--"}</strong><span>{active?.out ? `Clocked out ${active.out}` : "Ready for today's record"}</span><button onClick={clock}>{active?.in && !active?.out ? "Clock out" : "Clock in"}</button></div><div className="panel"><h3>Attendance Records</h3><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td>{employeeName(item.employeeId, employees)}</td><td>{item.date}</td><td>{item.in || "--"}</td><td>{item.out || "--"}</td><td><span className="badge">{item.status}</span></td></tr>)}</tbody></table></div></div></section>;
}
function Departments() {
  const { role, departments, setDepartments, employees, log } = useStore();
  const [name, setName] = useState("");
  const add = (event) => { event.preventDefault(); if (!name || role !== "Admin") return; setDepartments([...departments, name]); setName(""); log(`Created department ${name}`); };
  return <section className="split-layout"><div className="panel"><h3>Departments</h3><div className="dept-grid">{departments.map((dept) => <article className="mini-card" key={dept}><strong>{dept}</strong><span>{employees.filter((employee) => employee.department === dept && employee.status !== "Deleted").length} employees</span></article>)}</div></div><form className="panel form-panel" onSubmit={add}><h3>Configure Department</h3><input placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} disabled={role !== "Admin"} /><button disabled={role !== "Admin"}>Add department</button>{role !== "Admin" && <small>Only Admin can configure departments.</small>}</form></section>;
}

function Reports() {
  const { employees, leave, attendance, scopeEmployees } = useStore();
  const download = (type) => { const rows = type === "leave" ? leave.map((item) => `${item.id},${employeeName(item.employeeId, employees)},${item.type},${item.start},${item.end},${item.status}`) : attendance.map((item) => `${item.id},${employeeName(item.employeeId, employees)},${item.date},${item.in},${item.out},${item.status}`); const blob = new Blob([rows.join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${type}-report.csv`; a.click(); };
  const byDept = scopeEmployees.reduce((acc, employee) => { acc[employee.department] = acc[employee.department] || []; acc[employee.department].push(employee); return acc; }, {});
  return <section className="grid"><div className="stats-row"><Stat label="Active staff" value={scopeEmployees.filter((employee) => employee.status === "Active").length} detail="excluding archived" /><Stat label="Onboarding" value={scopeEmployees.filter((employee) => employee.status === "Onboarding").length} detail="new starters" /><Stat label="Approved leave" value={leave.filter((item) => item.status === "Approved").length} detail="all-time demo" /></div><div className="panel"><div className="section-head"><h3>Exportable Reports</h3><div><button onClick={() => download("leave")}>Leave CSV</button><button onClick={() => download("attendance")}>Attendance CSV</button></div></div>{Object.entries(byDept).map(([dept, people]) => <div className="bar" key={dept}><span>{dept}</span><i style={{ width: `${Math.max(12, people.length * 18)}%` }}></i><b>{people.length}</b></div>)}</div></section>;
}

function Audit() {
  const { role, audit } = useStore();
  if (role !== "Admin") return <section className="panel"><h3>Audit Log</h3><p className="muted">Only Admin can inspect system-wide write logs.</p></section>;
  return <section className="panel"><h3>Audit Log</h3><div className="timeline">{audit.map((item) => <div key={item.id}><b>{item.action}</b><span>{item.actor} at {item.when}</span></div>)}</div></section>;
}

export default function App() {
  const [view, setView] = useState("Dashboard");
  return <StoreProvider><Shell view={view} setView={setView} /></StoreProvider>;
}


