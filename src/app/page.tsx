import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
  Coins,
  Timer,
  Receipt,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">SideLootQuest</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild variant="gold" size="sm">
              <Link href="/signin">Start your quest</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Badge variant="outline" className="mb-6 border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> For people building after 5pm
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Level up your side hustle.
          <br />
          <span className="text-[color:var(--gold)]">Track the loot.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          A task manager that works like TickTick or Todoist — plus three things those can&apos;t
          do. Track revenue per task. Set aside tax automatically. Clock billable hours right from
          the timer.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="gold">
            <Link href="/signin">Get started — free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#features">See features</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            title="Tasks that parse themselves"
            body="Type 'Email client tomorrow 3pm' — due date gets pulled automatically. Projects, tags, priorities, sorting, the lot."
          />
          <Feature
            icon={<Coins className="h-5 w-5 text-[color:var(--gold)]" />}
            title="Hustle Mode on every task"
            body="Flag a task as $rate/hour or $fixed-price. Completing it drops loot into your dashboard. Taxable income gets calculated on the fly."
          />
          <Feature
            icon={<Timer className="h-5 w-5 text-primary" />}
            title="Pomodoro + billable timer"
            body="Same timer, two modes. Focus blocks build streaks. Billable blocks log hours against the task — so your $/hour tasks pay you."
          />
          <Feature
            icon={<Receipt className="h-5 w-5 text-[color:var(--gold)]" />}
            title="Tax jar"
            body="Set your rate (default 25%). Every dollar earned gets skimmed into a running set-aside total so April doesn't burn you."
          />
          <Feature
            icon={<Target className="h-5 w-5 text-primary" />}
            title="Weekly loot goal"
            body="Set a weekly revenue target. Dashboard shows pace, completion bar, streak. Makes the grind visible."
          />
          <Feature
            icon={<Zap className="h-5 w-5 text-[color:var(--gold)]" />}
            title="Clients lite"
            body="Group projects by client. Running revenue + hours per client. One place to see who's paying the bills."
          />
        </div>
      </section>

      {/* How different */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">
            Why not just use TickTick or Todoist?
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Those apps treat every task the same. A side hustler&apos;s task isn&apos;t a chore —
            it&apos;s a <em>revenue event</em>. SideLootQuest knows the difference.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Comparison label="Revenue tracking per task" us="✓" them="—" />
            <Comparison label="Tax set-aside" us="✓" them="—" />
            <Comparison label="Billable time log" us="✓" them="—" />
            <Comparison label="Client revenue view" us="✓" them="—" />
            <Comparison label="Pomodoro" us="✓" them="Paywalled" />
            <Comparison label="Natural-language dates" us="✓" them="✓" />
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p>SideLootQuest · Built for hustlers · Open to contributions</p>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Comparison({ label, us, them }: { label: string; us: string; them: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
      <span className="text-sm">{label}</span>
      <div className="flex gap-3 text-sm">
        <span className="text-[color:var(--gold)] font-semibold">{us}</span>
        <span className="text-muted-foreground">/ {them}</span>
      </div>
    </div>
  );
}
