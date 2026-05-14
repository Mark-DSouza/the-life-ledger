import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import { AuthShell, OtpScreen, LinkScreen } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your LifeOS account" },
      { name: "description", content: "Start your LifeOS — pick an avatar and we'll send a one-time code or magic link." },
    ],
  }),
  component: SignupPage,
});

type Mode = "form" | "otp" | "link";

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0].id);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<Mode>("form");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const send = async (next: "otp" | "link") => {
    if (!name.trim()) return toast.error("Tell us your name");
    if (!email) return toast.error("Enter your email");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { name: name.trim(), avatar },
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
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
    toast.success(`Welcome to LifeOS, ${name.split(" ")[0]}!`);
    navigate({ to: "/" });
  };

  return (
    <AuthShell title="Create your LifeOS" subtitle="Pick an avatar and tell us who you are.">
      {mode === "form" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvatar(a.id)}
                  aria-pressed={avatar === a.id}
                  className={cn(
                    "grid aspect-square place-items-center rounded-xl bg-gradient-to-br text-xl transition-all",
                    a.bg,
                    avatar === a.id
                      ? "scale-105 ring-2 ring-primary-light ring-offset-2 ring-offset-card"
                      : "opacity-80 hover:opacity-100",
                  )}
                >
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

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
              onClick={() => send("otp")}
              disabled={busy}
              className="h-11 bg-primary text-primary-foreground hover:bg-primary-light"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Get OTP
            </Button>
            <Button
              onClick={() => send("link")}
              disabled={busy}
              variant="outline"
              className="h-11 border-border bg-card hover:bg-card-nested"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Get login link
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary-light hover:underline">
              Log in
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

      {mode === "link" && <LinkScreen email={email} onBack={() => setMode("form")} />}
    </AuthShell>
  );
}
