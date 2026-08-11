import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ScanFace, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Presence Face Attendance" },
      {
        name: "description",
        content:
          "Sign in to Presence to manage face-recognition attendance, employees, kiosk devices and reports.",
      },
      { property: "og:title", content: "Sign in — Presence Face Attendance" },
      {
        property: "og:description",
        content: "Secure tenant sign-in for the Presence face attendance dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("admin@northwind.co");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (!password) {
        setError("Incorrect email or password. Please try again.");
        return;
      }
      navigate({ to: "/admin/dashboard" });
    }, 700);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ScanFace className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold">Presence</p>
              <p className="text-xs text-muted-foreground">Northwind Ltd. workspace</p>
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your work email to access the attendance dashboard.
          </p>

          {error && (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setError("Password reset link sent if the account exists.")}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Running a kiosk?{" "}
            <Link
              to="/kiosk/$deviceId"
              params={{ deviceId: "dev-1" }}
              className="font-medium text-primary hover:underline"
            >
              Open kiosk mode
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary/8 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/40" />
        <div className="relative flex h-full flex-col justify-end gap-4 p-12">
          <ScanFace className="h-10 w-10 text-primary" />
          <p className="max-w-md text-2xl font-medium leading-snug tracking-tight">
            Attendance that takes two seconds and one glance.
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Face-verified check-ins across every site, with audit-ready logs your HR team can
            actually read.
          </p>
        </div>
      </div>
    </div>
  );
}
