import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, MonitorSmartphone, Plus, QrCode } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { devices as seed, type Device } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/devices")({
  head: () => ({
    meta: [
      { title: "Kiosk devices — Presence" },
      {
        name: "description",
        content:
          "Register and monitor face-attendance kiosks: location, online status, last activity and API keys.",
      },
      { property: "og:title", content: "Kiosk devices — Presence" },
      {
        property: "og:description",
        content: "Manage kiosk tablets and terminals across every site from one place.",
      },
    ],
  }),
  component: DevicesPage,
});

function DeviceCard({ device }: { device: Device }) {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{device.name}</p>
            <p className="text-xs text-muted-foreground">{device.location}</p>
          </div>
        </div>
        <StatusBadge status={device.online ? "online" : "offline"} />
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Last active</dt>
          <dd className="tabular-nums">{device.lastActive}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">API key</dt>
          <dd className="flex items-center gap-1">
            <code className="rounded bg-muted px-2 py-1 text-xs">
              {revealed ? device.apiKey : "•".repeat(18)}
            </code>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevealed((v) => !v)}>
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                navigator.clipboard?.writeText(device.apiKey);
                toast.success("API key copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DevicesPage() {
  const [loading, setLoading] = React.useState(true);
  const [devices, setDevices] = React.useState<Device[]>(seed);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const register = () => {
    setDevices((prev) => [
      {
        id: `dev-${prev.length + 1}`,
        name: name || `Kiosk ${prev.length + 1}`,
        location: location || "Unassigned",
        lastActive: "Never",
        online: false,
        apiKey: `fa_live_${Math.random().toString(36).slice(2, 14)}`,
      },
      ...prev,
    ]);
    setOpen(false);
    setName("");
    setLocation("");
    toast.success("Device registered — scan the QR code on the kiosk to pair");
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Devices"
        description="Kiosks currently paired with this workspace."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Register new device
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={MonitorSmartphone}
            title="No devices registered"
            description="Register a kiosk to start accepting face check-ins at this location."
            action={<Button onClick={() => setOpen(true)}>Register new device</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register new device</DialogTitle>
            <DialogDescription>
              We generate an API key and pairing code. Scan it from the kiosk to self-configure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dname">Device name</Label>
              <Input
                id="dname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Front Desk Kiosk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dloc">Location</Label>
              <Input
                id="dloc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="HQ · Lobby"
              />
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-muted">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                A pairing QR code appears here once the device is created. It expires after 15
                minutes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={register}>Create device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
