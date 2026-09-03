import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, RefreshCw, ScanFace, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { devices, employees } from "@/lib/mock-data";

export const Route = createFileRoute("/kiosk/$deviceId")({
  head: () => ({
    meta: [
      { title: "Kiosk — Mark attendance with Presence" },
      {
        name: "description",
        content:
          "Full-screen kiosk mode: look at the camera to mark attendance in about two seconds.",
      },
      { property: "og:title", content: "Kiosk — Mark attendance with Presence" },
      {
        property: "og:description",
        content: "Face check-in screen for reception desks and factory floors.",
      },
    ],
  }),
  component: KioskPage,
});

type Phase = "idle" | "success" | "failed";

function KioskPage() {
  const { deviceId } = Route.useParams();
  const device = devices.find((d) => d.id === deviceId) ?? devices[0]!;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [error, setError] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [match, setMatch] = React.useState(employees[0]!);
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = React.useCallback(async () => {
    setError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setError(true);
    }
  }, []);

  React.useEffect(() => {
    start();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [start]);

  const simulate = (kind: Phase) => {
    if (kind === "success") {
      setMatch(employees[Math.floor(Math.random() * employees.length)]!);
    }
    setPhase(kind);
    setTimeout(() => setPhase("idle"), 3000);
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-50">
      <video
        ref={videoRef}
        muted
        playsInline
        className={cn("absolute inset-0 h-full w-full object-cover opacity-70", error && "hidden")}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/85" />

      {error ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-12 text-center">
          <VideoOff className="h-16 w-16 text-slate-300" />
          <h1 className="text-4xl font-semibold">Camera is not available</h1>
          <p className="max-w-xl text-xl text-slate-300">
            Allow camera access in the browser prompt, then tap Retry. If no prompt appears, unplug
            and reconnect the camera, then refresh this page.
          </p>
          <Button size="lg" className="h-14 px-8 text-lg" onClick={start}>
            <RefreshCw className="mr-2 h-5 w-5" /> Retry camera
          </Button>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-10 text-center">
          {phase === "idle" && (
            <>
              <div className="rounded-[45%] border-4 border-dashed border-primary/70 p-16 kiosk-pulse">
                <ScanFace className="h-24 w-24 text-primary" />
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
                Look at the camera to mark attendance.
              </h1>
              <p className="text-2xl text-slate-300">It only takes a moment.</p>
            </>
          )}

          {phase === "success" && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative">
                <img
                  src={match.photo}
                  alt=""
                  className="h-44 w-44 rounded-full border-4 border-success bg-slate-800 object-cover"
                />
                <span className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="h-8 w-8" />
                </span>
              </div>
              <h1 className="text-5xl font-semibold tracking-tight">{match.name}</h1>
              <p className="text-3xl font-medium text-success">Attendance marked</p>
              <p className="text-xl text-slate-300 tabular-nums">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {match.department}
              </p>
            </div>
          )}

          {phase === "failed" && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
              <div className="rounded-[45%] border-4 border-slate-500 p-16">
                <ScanFace className="h-24 w-24 text-slate-300" />
              </div>
              <h1 className="text-4xl font-semibold">Face not recognized — try again</h1>
              <p className="max-w-xl text-xl text-slate-300">
                Step a little closer and face the camera directly.
              </p>
            </div>
          )}
        </div>
      )}

      <footer className="relative z-10 flex items-center justify-between px-8 py-5 text-sm text-slate-400">
        <span>
          {device.name} · {device.location}
        </span>
        <span className="tabular-nums">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </footer>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 opacity-25 transition-opacity hover:opacity-100">
        <Button size="sm" variant="secondary" onClick={() => simulate("success")}>
          Demo match
        </Button>
        <Button size="sm" variant="secondary" onClick={() => simulate("failed")}>
          Demo no match
        </Button>
      </div>
    </div>
  );
}
