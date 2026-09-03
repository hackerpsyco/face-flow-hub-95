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

export const employees: Employee[] = [];

export const devices: Device[] = [
  {
    id: "dev-1",
    name: "Front Desk Kiosk",
    location: "HQ · Lobby",
    lastActive: "Just now",
    online: true,
    apiKey: "fa_live_northwind_kiosk_key",
  },
];

export const attendance: AttendanceRecord[] = [];
export const recentActivity: AttendanceRecord[] = [];
export const trend7: any[] = [];
export const trend30: any[] = [];
export const absentees: any[] = [];
export const subAdmins: any[] = [];
