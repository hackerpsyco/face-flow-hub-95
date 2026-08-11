import * as React from "react";
import { Camera, Check, RefreshCw, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLOTS = ["Front", "Slight left", "Slight right"] as const;

export function FaceCaptureWidget({
  onComplete,
}: {
  onComplete?: (shots: string[]) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [shots, setShots] = React.useState<(string | null)[]>([null, null, null]);

  const start = React.useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);
    } catch {
      setError("Camera unavailable. Allow camera access in your browser, then retry.");
    }
  }, []);

  React.useEffect(() => {
    start();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [start]);

  const nextIndex = shots.findIndex((s) => s === null);

  const capture = () => {
    if (nextIndex === -1) return;
    const video = videoRef.current;
    let data = "";
    if (video && video.videoWidth) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      data = canvas.toDataURL("image/jpeg", 0.8);
    }
    const next = [...shots];
    next[nextIndex] = data || "captured";
    setShots(next);
    if (next.every(Boolean)) onComplete?.(next as string[]);
  };

  const retake = () => setShots([null, null, null]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn("h-full w-full object-cover", (!ready || error) && "invisible")}
        />
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[78%] aspect-3/4 rounded-[45%] border-2 border-dashed border-primary/70 kiosk-pulse" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <VideoOff className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={start}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry camera
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 text-center",
              shots[i] ? "border-success/40 bg-success/5" : "border-dashed",
              nextIndex === i && "ring-2 ring-ring/40",
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {shots[i] ? <Check className="h-4 w-4 text-success" /> : <Camera className="h-4 w-4" />}
            </div>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={capture} disabled={!!error || nextIndex === -1} className="flex-1">
          <Camera className="mr-2 h-4 w-4" />
          {nextIndex === -1 ? "All angles captured" : `Capture ${SLOTS[nextIndex]}`}
        </Button>
        <Button variant="outline" onClick={retake} disabled={shots.every((s) => !s)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retake
        </Button>
      </div>
    </div>
  );
}
