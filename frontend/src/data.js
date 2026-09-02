export const roles = ["Admin", "HR Staff", "Manager", "Employee"];
export const sensitiveRoles = new Set(["Admin", "HR Staff"]);
export const uid = () => Math.random().toString(36).slice(2, 9);
export const today = () => new Date().toISOString().slice(0, 10);
export const timeNow = () => new Date().toTimeString().slice(0, 5);

export const initialEmployees = [
  { id: 1, name: "Maya Reed", email: "hr@pulsepeople.test", phone: "+1 202 555 0144", department: "People Operations", title: "HR Lead", managerId: null, status: "Active", startDate: "2022-01-17", salary: 82000, nationalId: "HR-2145", leaveBalance: 18, address: "North District", emergency: "Daniel Reed" },
  { id: 2, name: "Noah Kim", email: "manager@pulsepeople.test", phone: "+1 202 555 0181", department: "Engineering", title: "Engineering Manager", managerId: null, status: "Active", startDate: "2021-06-04", salary: 108000, nationalId: "EN-7741", leaveBalance: 14, address: "West Loop", emergency: "Jin Kim" },
  { id: 3, name: "Lena Brooks", email: "employee@pulsepeople.test", phone: "+1 202 555 0117", department: "Engineering", title: "Product Designer", managerId: 2, status: "Active", startDate: "2023-03-21", salary: 76000, nationalId: "DS-5933", leaveBalance: 16, address: "Lakeview", emergency: "Sam Brooks" },
  { id: 4, name: "Mateo Cruz", email: "mateo@pulsepeople.test", phone: "+1 202 555 0188", department: "Sales", title: "Account Executive", managerId: 2, status: "Active", startDate: "2024-02-12", salary: 69000, nationalId: "SL-8321", leaveBalance: 21, address: "Riverside", emergency: "Elena Cruz" },
  { id: 5, name: "Ivy Chen", email: "ivy@pulsepeople.test", phone: "+1 202 555 0194", department: "Finance", title: "Payroll Analyst", managerId: 1, status: "Onboarding", startDate: "2026-09-14", salary: 72000, nationalId: "FN-4027", leaveBalance: 21, address: "Market Street", emergency: "Alex Chen" }
];
export const initialLeave = [
  { id: 101, employeeId: 3, type: "Annual", start: "2026-09-07", end: "2026-09-09", reason: "Family travel", status: "Pending" },
  { id: 102, employeeId: 4, type: "Sick", start: "2026-08-31", end: "2026-09-01", reason: "Medical rest", status: "Approved" },
  { id: 103, employeeId: 2, type: "Study", start: "2026-09-18", end: "2026-09-18", reason: "Certification exam", status: "Pending" }
];
export const initialAttendance = [
  { id: 201, employeeId: 3, date: "2026-09-02", in: "08:55", out: "", status: "Present" },
  { id: 202, employeeId: 4, date: "2026-09-02", in: "09:15", out: "17:20", status: "Late" },
  { id: 203, employeeId: 2, date: "2026-09-02", in: "08:30", out: "17:42", status: "Present" },
  { id: 204, employeeId: 5, date: "2026-09-02", in: "", out: "", status: "Onboarding" }
];
