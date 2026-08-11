import { cn } from "@/lib/utils";

type Kind = "present" | "absent" | "late" | "active" | "inactive" | "online" | "offline";

const styles: Record<Kind, string> = {
  present: "bg-success/12 text-success ring-success/25",
  active: "bg-success/12 text-success ring-success/25",
  online: "bg-success/12 text-success ring-success/25",
  late: "bg-warning/18 text-warning-foreground ring-warning/40",
  absent: "bg-destructive/10 text-destructive ring-destructive/25",
  inactive: "bg-muted text-muted-foreground ring-border",
  offline: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: Kind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
