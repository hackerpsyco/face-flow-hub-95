import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, RefreshCw, ScanFace, VideoOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { devices, employees, type Employee } from "@/lib/mock-data";
import { api } from "@/lib/api";

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

type Phase = "idle" | "scanning" | "success" | "failed";

function KioskPage() {
  const { deviceId } = Route.useParams();
  const device = devices.find((d) => d.id === deviceId) ?? devices[0]!;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [error, setError] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [match, setMatch] = React.useState<Employee>(employees[0]!);
  const [confidence, setConfidence] = React.useState(0.94);
  const [scanMessage, setScanMessage] = React.useState("");
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

  // Capture current video frame and send to backend API
  const captureAndScan = async () => {
    if (phase !== "idle") return;
    setPhase("scanning");

    try {
      let base64Frame = "";
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64Frame = canvas.toDataURL("image/jpeg", 0.85);
        }
      }

      if (!base64Frame) {
        throw new Error("No camera frame captured");
      }

      const res = await api.scanAttendance(deviceId, base64Frame);

      if (res.matched && res.employee) {
        setMatch({
          id: res.employee.id || "emp-1",
          employeeId: res.employee.employeeId || "EMP-1024",
          name: res.employee.name || res.employee_name || "Employee",
          department: res.employee.department || "Operations",
          status: "active",
          faceEnrolled: true,
          photo: res.employee.photo || employees[0]!.photo,
        });
        setConfidence(res.confidence || 0.94);
        setPhase("success");
      } else {
        setScanMessage(res.message || "Face not recognized. Try again.");
        setPhase("failed");
      }
    } catch (err: any) {
      setScanMessage(err.message || "Attendance scan error");
      setPhase("failed");
    }

    setTimeout(() => setPhase("idle"), 3000);
  };

  const simulate = (kind: "success" | "failed") => {
    if (kind === "success") {
      setMatch(employees[Math.floor(Math.random() * employees.length)]!);
      setConfidence(0.92 + Math.random() * 0.07);
    } else {
      setScanMessage("Face not recognized — step closer and face the camera.");
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
      <canvas ref={canvasRef} className="hidden" />
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
              <button
                onClick={captureAndScan}
                className="group cursor-pointer rounded-[45%] border-4 border-dashed border-primary/70 p-16 kiosk-pulse transition-transform hover:scale-105"
              >
                <ScanFace className="h-24 w-24 text-primary transition-transform group-hover:scale-110" />
              </button>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
                Look at the camera to mark attendance.
              </h1>
              <p className="text-2xl text-slate-300">Tap icon or position face to scan.</p>
              <Button size="lg" className="h-12 px-8 text-lg" onClick={captureAndScan}>
                Scan Now
              </Button>
            </>
          )}

          {phase === "scanning" && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
              <div className="rounded-[45%] border-4 border-primary p-16 animate-pulse">
                <ScanFace className="h-24 w-24 text-primary animate-spin" />
              </div>
              <h1 className="text-4xl font-semibold">Analyzing face...</h1>
              <p className="text-xl text-slate-300">Processing pipeline & cosine matching</p>
            </div>
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
              <p className="text-3xl font-medium text-success">
                Attendance marked ({(confidence * 100).toFixed(1)}% match)
              </p>
              <p className="text-xl text-slate-300 tabular-nums">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {match.department}
              </p>
            </div>
          )}

          {phase === "failed" && (
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
              <div className="rounded-[45%] border-4 border-destructive p-16">
                <AlertCircle className="h-24 w-24 text-destructive" />
              </div>
              <h1 className="text-4xl font-semibold">{scanMessage || "Face not recognized"}</h1>
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

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 opacity-30 transition-opacity hover:opacity-100">
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
