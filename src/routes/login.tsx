import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — LifeOS" },
      { name: "description", content: "Sign in to your LifeOS dashboard with a one-time code or magic link." },
    ],
  }),
  component: LoginPage,
});

type Mode = "form" | "otp" | "link";

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<Mode>("form");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const requestOtp = async (next: "otp" | "link") => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMode(next);
    toast.success(next === "otp" ? "OTP sent to your email" : "Magic link sent");
  };

  const verifyOtp = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/" });
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue managing your life.">
      {mode === "form" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => requestOtp("otp")}
              disabled={busy}
              className="h-11 bg-primary text-primary-foreground hover:bg-primary-light"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Get OTP
            </Button>
            <Button
              onClick={() => requestOtp("link")}
              disabled={busy}
              variant="outline"
              className="h-11 border-border bg-card hover:bg-card-nested"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Get login link
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-primary-light hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      )}

      {mode === "otp" && (
        <OtpScreen
          email={email}
          code={code}
          setCode={setCode}
          onSubmit={verifyOtp}
          onBack={() => setMode("form")}
          busy={busy}
        />
      )}

      {mode === "link" && (
        <LinkScreen email={email} onBack={() => setMode("form")} />
      )}
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sidebar">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <div className="hidden flex-col justify-between lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-base font-bold">
              L
            </div>
            <span className="text-lg font-semibold">LifeOS</span>
          </Link>

          <div>
            <h2 className="text-3xl font-semibold leading-tight">
              One calm dashboard for every part of your life.
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Fitness, meals, sleep, mental wellbeing, personal goals, career and work — all
              in one place. No passwords. Just sign in with your email.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              {[
                "Passwordless login — OTP or magic link",
                "Track every weekday across 7 life areas",
                "Built mobile-first for on-the-go updates",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-light" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-tertiary">© LifeOS</div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OtpScreen({
  email,
  code,
  setCode,
  onSubmit,
  onBack,
  busy,
}: {
  email: string;
  code: string;
  setCode: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        onClick={onSubmit}
        disabled={busy || code.length !== 6}
        className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-light"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
      </Button>
    </div>
  );
}

export function LinkScreen({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="space-y-5 text-center">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
        <Mail className="h-7 w-7 text-primary-light" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a magic login link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Click it to sign in.
        </p>
      </div>
    </div>
  );
}
