import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AdminShell";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attendance, employees, type AttendanceRecord } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance log — Presence" },
      {
        name: "description",
        content:
          "Filter attendance by date range, employee, department and status, with confidence scores and CSV export.",
      },
      { property: "og:title", content: "Attendance log — Presence" },
      {
        property: "og:description",
        content: "Audit-ready check-in and check-out records from every kiosk device.",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [dept, setDept] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const rows = attendance.filter(
    (a) =>
      (query === "" || a.employee.toLowerCase().includes(query.toLowerCase())) &&
      (dept === "all" || a.department === dept) &&
      (status === "all" || a.status === status),
  );

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "employee",
      header: "Employee",
      sortable: true,
      sortValue: (r) => r.employee,
      cell: (r) => (
        <div>
          <p className="text-sm font-medium">{r.employee}</p>
          <p className="text-xs text-muted-foreground">{r.employeeId}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (r) => r.date,
      cell: (r) => <span className="text-sm tabular-nums">{r.date}</span>,
    },
    {
      key: "in",
      header: "Check in",
      cell: (r) => <span className="text-sm tabular-nums">{r.checkIn}</span>,
    },
    {
      key: "out",
      header: "Check out",
      cell: (r) => (
        <span className="text-sm tabular-nums text-muted-foreground">{r.checkOut ?? "—"}</span>
      ),
    },
    {
      key: "confidence",
      header: "Confidence",
      sortable: true,
      sortValue: (r) => r.confidence,
      cell: (r) =>
        r.confidence ? (
          <span className="text-sm tabular-nums">{(r.confidence * 100).toFixed(1)}%</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "device",
      header: "Device / location",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.device}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Attendance"
        description="Every verified check-in, with the device and match confidence behind it."
        actions={
          <Button variant="outline" onClick={() => toast.success("Export started — CSV ready soon")}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="surface-card">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <DateRangePicker />
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee"
              className="pl-9"
            />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          pageSize={10}
          loading={loading}
          empty={
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records"
              description="Nothing matches these filters. Try a wider date range or clear the department filter."
            />
          }
        />
      </div>
    </div>
  );
}
