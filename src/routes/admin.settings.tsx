import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AdminShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subAdmins as seed } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Presence Attendance" },
      {
        name: "description",
        content:
          "Configure working hours, late-mark threshold, notification preferences and sub-admin access.",
      },
      { property: "og:title", content: "Settings — Presence Attendance" },
      {
        property: "og:description",
        content: "Workspace rules and team access for your face attendance platform.",
      },
    ],
  }),
  component: SettingsPage,
});

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Separator className="my-5" />
      {children}
    </div>
  );
}

function SettingsPage() {
  const [users, setUsers] = React.useState(seed);
  const [toRemove, setToRemove] = React.useState<(typeof seed)[number] | null>(null);
  const [invite, setInvite] = React.useState("");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="Workspace-wide rules applied to every kiosk and report."
        actions={<Button onClick={() => toast.success("Settings saved")}>Save changes</Button>}
      />

      <div className="space-y-6">
        <Section
          title="Working hours"
          description="Used to decide when a check-in counts as on time."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start">Shift start</Label>
              <Input id="start" type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Shift end</Label>
              <Input id="end" type="time" defaultValue="18:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late">Late-mark threshold (min)</Label>
              <Input id="late" type="number" defaultValue={15} min={0} />
            </div>
          </div>
        </Section>

        <Section
          title="Notifications"
          description="Who hears about late arrivals and absentees, and how."
        >
          <div className="space-y-4">
            {[
              ["Email digest", "Daily attendance summary at 7pm"],
              ["SMS alerts", "Text supervisors when a site drops below 80% attendance"],
              ["Absentee alerts", "Notify HR when an employee misses 3 consecutive days"],
            ].map(([label, desc], i) => (
              <div key={label} className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch defaultChecked={i !== 1} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Team access" description="Invite sub-admins and set what they can do.">
          <div className="flex flex-wrap gap-2">
            <Input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              placeholder="colleague@company.com"
              className="min-w-[220px] flex-1"
            />
            <Select defaultValue="Viewer">
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="HR Manager">HR Manager</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (!invite) return;
                setUsers((u) => [
                  ...u,
                  { id: `u${u.length + 1}`, name: invite.split("@")[0] ?? invite, email: invite, role: "Viewer" },
                ]);
                setInvite("");
                toast.success("Invitation sent");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Invite
            </Button>
          </div>

          <ul className="mt-5 divide-y rounded-lg border">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <UserCog className="h-3.5 w-3.5" /> {u.role}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setToRemove(u)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(v) => !v && setToRemove(null)}
        title={`Remove ${toRemove?.name ?? "user"}?`}
        description="They will immediately lose access to this workspace and all attendance data."
        confirmLabel="Remove access"
        onConfirm={() => {
          setUsers((u) => u.filter((x) => x.id !== toRemove?.id));
          toast.success("Access removed");
          setToRemove(null);
        }}
      />
    </div>
  );
}
