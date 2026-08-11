import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Users, Search, MoreHorizontal, Check, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AdminShell";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FaceCaptureWidget } from "@/components/FaceCaptureWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { employees as seed, type Employee } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Presence Attendance" },
      {
        name: "description",
        content:
          "Search, filter and manage employees, and enroll faces with a guided three-angle webcam capture.",
      },
      { property: "og:title", content: "Employees — Presence Attendance" },
      {
        property: "og:description",
        content: "Manage employee records, departments and face enrollment status.",
      },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [rows, setRows] = React.useState<Employee[]>(seed);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [dept, setDept] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [drawer, setDrawer] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Employee | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const departments = Array.from(new Set(seed.map((e) => e.department)));

  const filtered = rows.filter(
    (e) =>
      (query === "" ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(query.toLowerCase())) &&
      (dept === "all" || e.department === dept) &&
      (status === "all" || e.status === status),
  );

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={r.photo} alt="" />
            <AvatarFallback>{r.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      sortValue: (r) => r.department,
      cell: (r) => <span className="text-sm">{r.department}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "face",
      header: "Face enrolled",
      cell: (r) =>
        r.faceEnrolled ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <Check className="h-4 w-4" /> Enrolled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <X className="h-4 w-4" /> Not enrolled
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.success(`Editing ${r.name}`)}>
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDrawer(true)}>Re-enroll face</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRows((prev) =>
                  prev.map((x) =>
                    x.id === r.id
                      ? { ...x, status: x.status === "active" ? "inactive" : "active" }
                      : x,
                  ),
                );
                toast.success(`${r.name} updated`);
              }}
            >
              {r.status === "active" ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setToDelete(r)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Employees"
        description={`${rows.length} people · ${rows.filter((r) => r.faceEnrolled).length} faces enrolled`}
        actions={
          <Button onClick={() => setDrawer(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add employee
          </Button>
        }
      />

      <div className="surface-card">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or employee ID"
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          empty={
            <EmptyState
              icon={Users}
              title="No employees match"
              description="Try clearing the filters, or add your first employee to get started."
              action={
                <Button onClick={() => setDrawer(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add employee
                </Button>
              }
            />
          }
        />
      </div>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add employee</SheetTitle>
            <SheetDescription>
              Enter details, then capture three face angles for reliable recognition.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ename">Full name</Label>
                <Input id="ename" placeholder="Jane Cooper" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eid">Employee ID</Label>
                <Input id="eid" placeholder="EMP-1042" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t pt-5">
              <div>
                <p className="text-sm font-medium">Face enrollment</p>
                <p className="text-xs text-muted-foreground">
                  Ask the employee to look straight ahead, then turn slightly left and right.
                </p>
              </div>
              <FaceCaptureWidget onComplete={() => toast.success("All three angles captured")} />
            </div>

            <div className="flex gap-2 border-t pt-5">
              <Button variant="outline" className="flex-1" onClick={() => setDrawer(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setDrawer(false);
                  toast.success("Employee saved and face enrolled");
                }}
              >
                Save employee
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={`Delete ${toDelete?.name ?? "employee"}?`}
        description="This permanently removes the employee record and their enrolled face data. This cannot be undone."
        confirmLabel="Delete employee"
        onConfirm={() => {
          setRows((prev) => prev.filter((x) => x.id !== toDelete?.id));
          toast.success("Employee deleted");
          setToDelete(null);
        }}
      />
    </div>
  );
}
