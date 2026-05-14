import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dumbbell,
  UtensilsCrossed,
  Moon,
  Brain,
  User as UserIcon,
  Briefcase,
  ListChecks,
  ArrowRight,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const TILES = [
  { to: "/fitness", title: "Fitness", desc: "Plan workouts, log reps & cardio.", icon: Dumbbell, accent: "from-violet-500 to-fuchsia-500" },
  { to: "/meals", title: "Meals", desc: "Track calories & macros every day.", icon: UtensilsCrossed, accent: "from-emerald-400 to-teal-500" },
  { to: "/sleep", title: "Sleep", desc: "Bedtime, wake-up, interruptions.", icon: Moon, accent: "from-indigo-400 to-blue-500" },
  { to: "/mental", title: "Mental Wellbeing", desc: "Mood, stress & therapy notes.", icon: Brain, accent: "from-pink-400 to-rose-500" },
  { to: "/personal", title: "Personal", desc: "Habits, relationships, growth.", icon: UserIcon, accent: "from-amber-400 to-orange-500" },
  { to: "/career", title: "Career", desc: "Long-term goals & milestones.", icon: ListChecks, accent: "from-cyan-400 to-sky-500" },
  { to: "/work", title: "Work", desc: "Projects, deep work, deliverables.", icon: Briefcase, accent: "from-purple-500 to-violet-600" },
] as const;

const CHART_DATA = [
  { m: "Jan", Fitness: 32, Meals: 40, Mental: 28, Career: 22, Work: 35 },
  { m: "Feb", Fitness: 38, Meals: 44, Mental: 34, Career: 28, Work: 41 },
  { m: "Mar", Fitness: 45, Meals: 50, Mental: 42, Career: 33, Work: 47 },
  { m: "Apr", Fitness: 52, Meals: 58, Mental: 48, Career: 38, Work: 52 },
  { m: "May", Fitness: 58, Meals: 64, Mental: 55, Career: 46, Work: 56 },
  { m: "Jun", Fitness: 65, Meals: 70, Mental: 62, Career: 54, Work: 63 },
  { m: "Jul", Fitness: 71, Meals: 75, Mental: 68, Career: 60, Work: 68 },
  { m: "Aug", Fitness: 76, Meals: 78, Mental: 72, Career: 66, Work: 73 },
  { m: "Sep", Fitness: 80, Meals: 82, Mental: 76, Career: 71, Work: 78 },
];

const ATTENTION = [
  { area: "Fitness", text: "Skipped Tuesday — reschedule chest day", tone: "warn" as const },
  { area: "Meals", text: "Protein 22 g under goal yesterday", tone: "warn" as const },
  { area: "Mental", text: "Therapy session at 5 pm Thursday", tone: "primary" as const },
  { area: "Work", text: "Roadmap review draft due Friday", tone: "warn" as const },
];

const BACKBURNER = [
  { area: "Personal", text: "Plan parents' anniversary trip" },
  { area: "Career", text: "Refresh portfolio site & case studies" },
  { area: "Sleep", text: "Try 30-day no-screens-after-10 routine" },
  { area: "Personal", text: "Read 'Designing Your Life' (chap. 4–6)" },
];

function LandingPage() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.name as string | undefined)?.split(" ")[0];

  return (
    <AppShell>
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary-light">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-light" /> Welcome
              {name ? `, ${name}` : ""}
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              One calm dashboard for every part of your life.
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Track fitness, meals, sleep, mental wellbeing, personal growth, career and
              work — all in one place.
            </p>
          </div>
          {!user && (
            <div className="flex shrink-0 gap-2">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-light"
              >
                Create your LifeOS
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-card-nested"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tiles */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-tertiary">
          Your life areas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TILES.map(({ to, title, desc, icon: Icon, accent }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden rounded-xl border border-border bg-gradient-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:ring-brand"
            >
              <div
                className={cn(
                  "mb-4 grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br text-white shadow-lg",
                  accent,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{title}</h3>
                <ArrowRight className="h-4 w-4 -translate-x-1 text-tertiary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary-light" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Progress chart */}
      <section className="mb-10 rounded-2xl border border-border bg-gradient-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Progress across life</h2>
            <p className="text-sm text-muted-foreground">
              Imaginary progress over the last 9 months.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {[
              { k: "Fitness", c: "var(--chart-1)" },
              { k: "Meals", c: "var(--chart-2)" },
              { k: "Mental", c: "var(--chart-3)" },
              { k: "Career", c: "var(--chart-4)" },
              { k: "Work", c: "var(--chart-5)" },
            ].map((l) => (
              <div key={l.k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: l.c }} />
                {l.k}
              </div>
            ))}
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <defs>
                {["1", "2", "3", "4", "5"].map((n) => (
                  <linearGradient key={n} id={`g${n}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`var(--chart-${n})`} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={`var(--chart-${n})`} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={false} stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis tickLine={false} axisLine={false} stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
              />
              <Area type="monotone" dataKey="Fitness" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="Meals" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={2} />
              <Area type="monotone" dataKey="Mental" stroke="var(--chart-3)" fill="url(#g3)" strokeWidth={2} />
              <Area type="monotone" dataKey="Career" stroke="var(--chart-4)" fill="url(#g4)" strokeWidth={2} />
              <Area type="monotone" dataKey="Work" stroke="var(--chart-5)" fill="url(#g5)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Attention + Backburner */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-gradient-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold">Needs your attention</h2>
          </div>
          <ul className="space-y-2">
            {ATTENTION.map((it, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    it.tone === "warn"
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                      : "border-primary/30 bg-primary/15 text-primary-light",
                  )}
                >
                  {it.area}
                </span>
                <span className="text-sm">{it.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary-light ring-1 ring-primary/30">
              <Inbox className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold">Back-burner</h2>
          </div>
          <ul className="space-y-2">
            {BACKBURNER.map((it, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-border bg-card-nested px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {it.area}
                </span>
                <span className="text-sm">{it.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
