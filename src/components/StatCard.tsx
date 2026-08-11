import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  tone?: "primary" | "success" | "warning" | "destructive";
  loading?: boolean;
};

const toneMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ icon: Icon, label, value, trend, tone = "primary", loading }: Props) {
  if (loading) {
    return (
      <div className="surface-card p-5">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="mt-4 h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-16" />
      </div>
    );
  }

  return (
    <div className="surface-card p-5 transition-shadow hover:shadow-pop">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneMap[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trend >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
