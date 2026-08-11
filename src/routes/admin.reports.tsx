import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/AdminShell";
import { StatCard } from "@/components/StatCard";
import { DateRangePicker } from "@/components/DateRangePicker";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trend7, absentees } from "@/lib/mock-data";
import { CalendarCheck, Clock, Percent } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Presence Attendance" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly attendance reports with summary metrics, absentee alerts and PDF/CSV export.",
      },
      { property: "og:title", content: "Reports — Presence Attendance" },
      {
        property: "og:description",
        content: "Generate attendance summaries and spot employees below threshold.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [type, setType] = React.useState("weekly");

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Reports"
        description="Summaries your HR team can send straight to payroll."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("CSV export queued")}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button onClick={() => toast.success("PDF report generated")}>
              <FileBarChart className="mr-2 h-4 w-4" /> Generate PDF
            </Button>
          </>
        }
      />

      <div className="surface-card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        {type === "custom" && <DateRangePicker />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Percent} label="Average attendance" value="93.4%" trend={1} tone="success" />
        <StatCard icon={Clock} label="Avg. late minutes" value="7.2" trend={-8} tone="warning" />
        <StatCard icon={CalendarCheck} label="Total check-ins" value="1,003" trend={3} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="surface-card xl:col-span-2">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">Present vs. absent</h2>
            <p className="text-xs text-muted-foreground">Selected reporting period</p>
          </div>
          <div className="h-[300px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend7} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="present" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <div>
              <h2 className="text-base font-semibold">Absentee alerts</h2>
              <p className="text-xs text-muted-foreground">Below 80% attendance threshold</p>
            </div>
          </div>
          {absentees.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Everyone is on track"
              description="No employees fell below the attendance threshold this period."
            />
          ) : (
            <div className="divide-y">
              {absentees.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={a.photo} alt="" />
                    <AvatarFallback>{a.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <Progress value={a.rate} className="mt-1.5 h-1.5" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{a.rate}%</p>
                    <p className="text-xs text-muted-foreground">{a.missed} missed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
