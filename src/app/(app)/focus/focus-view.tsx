"use client";

import * as React from "react";
import { format } from "date-fns";
import { Timer, Play, Square, Coins, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, formatSeconds, formatMoney, formatHours } from "@/lib/utils";
import { startTimer, stopTimer } from "../actions";

export type Task = {
  id: string;
  title: string;
  billingType: string; // validated to NONE|HOURLY|FIXED at write time via Zod
  rateCents: number | null;
  priceCents: number | null;
};

type Entry = {
  id: string;
  kind: string;
  startedAt: Date;
  endedAt: Date | null;
  seconds: number;
  task: { id: string; title: string } | null;
};

const POMODORO_SECONDS = 25 * 60;

export function FocusView({
  tasks,
  recent,
  activeEntry,
  todayFocusSeconds,
  todayBillableSeconds,
}: {
  tasks: Task[];
  recent: Entry[];
  activeEntry: { id: string; kind: string; startedAt: Date; taskId: string | null } | null;
  todayFocusSeconds: number;
  todayBillableSeconds: number;
}) {
  const [kind, setKind] = React.useState<"focus" | "billable">(
    activeEntry?.kind === "billable" ? "billable" : "focus",
  );
  const [taskId, setTaskId] = React.useState<string>(activeEntry?.taskId ?? "");
  const [elapsed, setElapsed] = React.useState(() =>
    activeEntry
      ? Math.max(0, Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000))
      : 0,
  );
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!activeEntry) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [activeEntry]);

  const selectedTask = tasks.find((t) => t.id === taskId);
  const isRunning = !!activeEntry;

  // Pomodoro progress (for focus mode)
  const pomodoroProgress = kind === "focus" ? Math.min(1, elapsed / POMODORO_SECONDS) : 0;
  const pomodoroCompleted = kind === "focus" && elapsed >= POMODORO_SECONDS;

  // Live potential earnings while billable timer runs
  const liveEarnedCents =
    kind === "billable" && selectedTask?.billingType === "HOURLY" && selectedTask.rateCents
      ? Math.round((selectedTask.rateCents * elapsed) / 3600)
      : 0;

  function handleStart() {
    if (kind === "billable" && !taskId) {
      alert("Pick a task to bill the time against.");
      return;
    }
    startTransition(async () => {
      await startTimer(kind, taskId || undefined);
      setElapsed(0);
    });
  }

  function handleStop() {
    if (!activeEntry) return;
    startTransition(async () => {
      await stopTimer(activeEntry.id);
      setElapsed(0);
    });
  }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Focus</h1>

      {/* Today stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="h-5 w-5 text-primary" />}
          label="Focus today"
          value={formatHours(todayFocusSeconds)}
        />
        <StatCard
          icon={<Coins className="h-5 w-5 text-[color:var(--gold)]" />}
          label="Billable today"
          value={formatHours(todayBillableSeconds)}
        />
      </div>

      {/* Timer */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <ModeToggle
              active={kind === "focus"}
              onClick={() => !isRunning && setKind("focus")}
              disabled={isRunning}
            >
              <Timer className="h-4 w-4" /> Focus (25m)
            </ModeToggle>
            <ModeToggle
              active={kind === "billable"}
              onClick={() => !isRunning && setKind("billable")}
              disabled={isRunning}
            >
              <Coins className="h-4 w-4" /> Billable
            </ModeToggle>
          </div>

          {!isRunning && kind === "billable" && (
            <div className="mx-auto mb-6 max-w-sm">
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a task to bill against…" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                      {t.billingType === "HOURLY" && t.rateCents
                        ? ` · ${formatMoney(t.rateCents)}/hr`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isRunning && activeEntry?.taskId && (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Working on:{" "}
              <span className="text-foreground">
                {recent.find((r) => r.task?.id === activeEntry.taskId)?.task?.title ?? "task"}
              </span>
            </p>
          )}

          <div className="text-center">
            <div
              className={cn(
                "font-mono text-7xl font-bold tabular-nums tracking-tight",
                pomodoroCompleted && "text-[color:var(--gold)]",
              )}
            >
              {formatSeconds(elapsed)}
            </div>
            {kind === "focus" && isRunning && (
              <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pomodoroProgress * 100}%` }}
                />
              </div>
            )}
            {liveEarnedCents > 0 && (
              <p className="mt-3 text-sm text-[color:var(--gold)]">
                + {formatMoney(liveEarnedCents)} earned
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            {isRunning ? (
              <Button size="lg" variant="destructive" onClick={handleStop} disabled={pending}>
                <Square className="h-4 w-4" /> Stop
              </Button>
            ) : (
              <Button size="lg" variant="gold" onClick={handleStart} disabled={pending}>
                <Play className="h-4 w-4" /> Start
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Recent</h2>
          <div className="space-y-2">
            {recent.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    {e.kind === "billable" ? (
                      <Coins className="h-4 w-4 text-[color:var(--gold)]" />
                    ) : (
                      <Timer className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <p>{e.task?.title ?? (e.kind === "focus" ? "Focus block" : "Billable time")}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(e.startedAt, "MMM d, h:mma")} ·{" "}
                        {e.endedAt ? formatSeconds(e.seconds) : "running"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{e.kind}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ModeToggle({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
