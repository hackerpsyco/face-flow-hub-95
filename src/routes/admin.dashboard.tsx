import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  UserCheck,
  UserX,
  Clock,
  Users,
  UserPlus,
  FileBarChart,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Presence Attendance" },
      {
        name: "description",
        content:
          "Today's attendance at a glance: present, absent, late arrivals, trends and recent face check-ins.",
      },
      { property: "og:title", content: "Dashboard — Presence Attendance" },
      {
        property: "og:description",
        content: "Live attendance stats, 7/30-day trends and the latest kiosk check-ins.",
      },
    ],
  }),
  component: DashboardPage,
});

export function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<"7" | "30">("7");

  const [stats, setStats] = React.useState({
    present: 0,
    absent: 0,
    late: 0,
    totalEmployees: 0,
  });

  const [recentCheckins, setRecentCheckins] = React.useState<any[]>([]);
  const [trendData, setTrendData] = React.useState<any[]>([]);

  const todayDateStr = React.useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res) {
        setStats({
          present: res.present_today ?? res.present ?? 0,
          absent: res.absent_today ?? res.absent ?? 0,
          late: res.late_today ?? res.late ?? 0,
          totalEmployees: res.total_employees ?? res.total ?? 0,
        });

        if (Array.isArray(res.recent_checkins)) {
          setRecentCheckins(res.recent_checkins);
        }

        if (Array.isArray(res.trend)) {
          setTrendData(res.trend);
        }
      }
    } catch {
      // If backend stats call fails, fallback gracefully to zeros
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Good morning, Admin"
        description={`${todayDateStr} · Northwind Ltd.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/reports">
                <FileBarChart className="mr-2 h-4 w-4" /> View reports
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/employees">
                <UserPlus className="mr-2 h-4 w-4" /> Enroll employee
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          icon={UserCheck}
          label="Present today"
          value={stats.present}
          tone="success"
        />
        <StatCard
          loading={loading}
          icon={UserX}
          label="Absent today"
          value={stats.absent}
          tone="destructive"
        />
        <StatCard
          loading={loading}
          icon={Clock}
          label="Late arrivals"
          value={stats.late}
          tone="warning"
        />
        <StatCard
          loading={loading}
          icon={Users}
          label="Total employees"
          value={stats.totalEmployees}
          tone="primary"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="surface-card xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Attendance trend</h2>
              <p className="text-xs text-muted-foreground">Daily check-ins across all sites</p>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30")}>
              <TabsList>
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="30">30 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-[300px] p-4">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : trendData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Activity className="mb-2 h-8 w-8 text-muted" />
                <p className="text-sm">No trend data recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#present)"
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">Recent check-ins</h2>
            <p className="text-xs text-muted-foreground">Last 10 face verifications</p>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentCheckins.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No check-ins yet"
                description="Activity will appear here as employees check in at a kiosk."
              />
            ) : (
              recentCheckins.map((a: any, i: number) => (
                <div key={a.id || i} className="flex items-center gap-3 px-5 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={a.photo_url || a.photo || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(a.employee_name || "User")}`} alt="" />
                    <AvatarFallback>{(a.employee_name || a.employee || "EM").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.employee_name || a.employee || "Employee"}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.device_name || a.device || "Front Kiosk"}</p>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">{a.check_in || a.checkIn || "--:--"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
