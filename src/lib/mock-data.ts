export type EmployeeStatus = "active" | "inactive";
export type AttendanceStatus = "present" | "absent" | "late";

export type Employee = {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  status: EmployeeStatus;
  faceEnrolled: boolean;
  photo: string;
};

export type AttendanceRecord = {
  id: string;
  employee: string;
  employeeId: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  confidence: number;
  device: string;
  status: AttendanceStatus;
};

export type Device = {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  online: boolean;
  apiKey: string;
};

const DEPARTMENTS = ["Operations", "Engineering", "Finance", "HR", "Support"];

function avatar(seed: string) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=d1e7ef,e3e9ef,dbeee4`;
}

const NAMES = [
  "Aarav Mehta",
  "Priya Nair",
  "Daniel Okafor",
  "Sofia Ramirez",
  "Chen Wei",
  "Fatima Al-Sayed",
  "Liam Novak",
  "Grace Mensah",
  "Yuki Tanaka",
  "Marcus Bell",
  "Elena Petrova",
  "Rahul Verma",
  "Nora Lindqvist",
  "Tomas Duarte",
  "Amina Diallo",
  "Jonas Weber",
  "Isabel Costa",
  "Kevin Park",
];

export const employees: Employee[] = NAMES.map((name, i) => ({
  id: `emp-${i + 1}`,
  employeeId: `EMP-${(1024 + i).toString()}`,
  name,
  department: DEPARTMENTS[i % DEPARTMENTS.length]!,
  status: i % 9 === 8 ? "inactive" : "active",
  faceEnrolled: i % 5 !== 3,
  photo: avatar(name),
}));

const DEVICE_NAMES = [
  { name: "Front Desk Kiosk", location: "HQ · Lobby" },
  { name: "Factory Gate A", location: "Plant 1 · North Gate" },
  { name: "Warehouse Entry", location: "Depot · Dock 3" },
  { name: "Office Floor 4", location: "HQ · Floor 4" },
];

export const devices: Device[] = DEVICE_NAMES.map((d, i) => ({
  id: `dev-${i + 1}`,
  name: d.name,
  location: d.location,
  lastActive: i === 2 ? "3 days ago" : `${(i + 1) * 2} min ago`,
  online: i !== 2,
  apiKey: `fa_live_${Math.abs(hash(d.name)).toString(36).padStart(10, "0")}k${i}92xq7`,
}));

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

const TIMES: Array<[string, string | null, AttendanceStatus]> = [
  ["08:52", "17:31", "present"],
  ["09:41", "18:02", "late"],
  ["08:47", null, "present"],
  ["—", null, "absent"],
  ["08:58", "17:12", "present"],
  ["09:22", "17:48", "late"],
];

export const attendance: AttendanceRecord[] = Array.from({ length: 42 }, (_, i) => {
  const emp = employees[i % employees.length]!;
  const [checkIn, checkOut, status] = TIMES[i % TIMES.length]!;
  const d = new Date(2026, 7, 11 - Math.floor(i / 6));
  return {
    id: `att-${i + 1}`,
    employee: emp.name,
    employeeId: emp.employeeId,
    department: emp.department,
    date: d.toISOString().slice(0, 10),
    checkIn,
    checkOut,
    confidence: status === "absent" ? 0 : 0.88 + ((i * 7) % 11) / 100,
    device: devices[i % devices.length]!.name,
    status,
  };
});

export const recentActivity = attendance
  .filter((a) => a.status !== "absent")
  .slice(0, 10)
  .map((a) => ({
    ...a,
    photo: employees.find((e) => e.name === a.employee)!.photo,
  }));

export const trend7 = [
  { day: "Aug 05", present: 142, late: 11, absent: 9 },
  { day: "Aug 06", present: 148, late: 7, absent: 7 },
  { day: "Aug 07", present: 139, late: 14, absent: 9 },
  { day: "Aug 08", present: 151, late: 6, absent: 5 },
  { day: "Aug 09", present: 128, late: 9, absent: 25 },
  { day: "Aug 10", present: 146, late: 10, absent: 6 },
  { day: "Aug 11", present: 149, late: 8, absent: 5 },
];

export const trend30 = Array.from({ length: 30 }, (_, i) => ({
  day: `Jul ${((i + 12) % 30) + 1}`,
  present: 130 + ((i * 13) % 25),
  late: 4 + ((i * 5) % 12),
  absent: 3 + ((i * 7) % 18),
}));

export const absentees = employees.slice(0, 6).map((e, i) => ({
  ...e,
  rate: 62 + i * 4,
  missed: 9 - i,
}));

export const subAdmins = [
  { id: "u1", name: "Priya Nair", email: "priya@northwind.co", role: "Admin" },
  { id: "u2", name: "Daniel Okafor", email: "daniel@northwind.co", role: "HR Manager" },
  { id: "u3", name: "Grace Mensah", email: "grace@northwind.co", role: "Viewer" },
];
