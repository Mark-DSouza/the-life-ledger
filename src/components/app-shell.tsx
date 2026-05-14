import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  Brain,
  User as UserIcon,
  Briefcase,
  ListChecks,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { avatarById } from "@/lib/avatars";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/fitness", label: "Fitness", icon: Dumbbell },
  { to: "/meals", label: "Meals", icon: UtensilsCrossed },
  { to: "/sleep", label: "Sleep", icon: Moon },
  { to: "/mental", label: "Mental", icon: Brain },
  { to: "/personal", label: "Personal", icon: UserIcon },
  { to: "/career", label: "Career", icon: ListChecks },
  { to: "/work", label: "Work", icon: Briefcase },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const name = (user?.user_metadata?.name as string | undefined) ?? "Friend";
  const avatar = avatarById(user?.user_metadata?.avatar as string | undefined);

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-base font-bold text-primary-foreground">
          L
        </div>
        <div>
          <div className="text-sm font-semibold leading-none">LifeOS</div>
          <div className="text-[11px] text-tertiary">Your life, one OS</div>
        </div>
      </Link>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-primary-light" : "text-tertiary group-hover:text-foreground",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-border bg-card p-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br text-base",
                avatar.bg,
              )}
            >
              {avatar.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-[11px] text-tertiary">{user.email}</div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-tertiary transition-colors hover:bg-card-nested hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary-light"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-md border border-border px-3 py-2 text-center text-sm font-medium hover:bg-card-nested"
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sidebar text-foreground">
      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-sidebar/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-sm font-bold text-primary-foreground">
            L
          </div>
          <span className="text-sm font-semibold">LifeOS</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md border border-border p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/60 bg-sidebar lg:block">
          {SidebarInner}
        </aside>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-sidebar">
              {SidebarInner}
            </aside>
          </div>
        )}

        <main className="min-h-[calc(100vh-56px)] flex-1 bg-background lg:min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {loading ? (
              <div className="grid min-h-[40vh] place-items-center text-tertiary">
                Loading…
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
