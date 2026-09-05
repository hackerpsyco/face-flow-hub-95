import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  MonitorSmartphone,
  FileBarChart,
  Settings,
  ScanFace,
  LogOut,
  Menu,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/employees", label: "Employees", icon: Users },
  { to: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/admin/devices", label: "Devices", icon: MonitorSmartphone },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-1.5 p-3">
      <div className="mb-2 px-1">
        <Button asChild size="sm" className="w-full justify-start gap-2 shadow-xs" onClick={onNavigate}>
          <Link to="/kiosk/$deviceId" params={{ deviceId: "dev-1" }}>
            <ScanFace className="h-4 w-4" />
            <span>Open Kiosk Mode</span>
          </Link>
        </Button>
      </div>
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 border-b px-5 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ScanFace className="h-[18px] w-[18px]" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Presence</p>
        <p className="text-xs text-muted-foreground">Northwind Ltd.</p>
      </div>
    </div>
  );
}

export function AdminShell() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <div className="border-t p-3">
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-card/80 px-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Brand />
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold tracking-tight text-foreground lg:hidden">Presence</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" className="h-9 gap-1.5 text-xs font-semibold sm:text-sm">
              <Link to="/kiosk/$deviceId" params={{ deviceId: "dev-1" }}>
                <ScanFace className="h-4 w-4" />
                <span>Face Check-in</span>
              </Link>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin" alt="" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
