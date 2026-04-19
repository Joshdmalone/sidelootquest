"use client";

import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Widget timer. Runs fully client-side — state is persisted to widget.content
 * on every transition so it survives reloads. Tracks "seconds" remaining and
 * the "lastStartedAt" timestamp for accurate resume across tabs.
 *
 * For the billable / Pomodoro-session version that writes to the TimeEntry
 * table (so hours roll up into /loot), see /focus.
 */
export function TimerWidget({
  content,
  setContent,
}: {
  content: Record<string, unknown>;
  setContent: (c: Record<string, unknown>) => void;
}) {
  const seconds = typeof content.seconds === "number" ? content.seconds : 1500;
  const running = Boolean(content.running);
  const lastStartedAt =
    typeof content.lastStartedAt === "number" ? (content.lastStartedAt as number) : null;

  const [remaining, setRemaining] = React.useState(() => computeRemaining(seconds, running, lastStartedAt));
  const [durationInput, setDurationInput] = React.useState("25");

  // Tick while running
  React.useEffect(() => {
    if (!running) {
      setRemaining(seconds);
      return;
    }
    const t = setInterval(() => {
      setRemaining(computeRemaining(seconds, running, lastStartedAt));
    }, 250);
    return () => clearInterval(t);
  }, [running, seconds, lastStartedAt]);

  // Auto-stop when hitting zero
  React.useEffect(() => {
    if (running && remaining <= 0) {
      setContent({ seconds: 0, running: false, lastStartedAt: null });
      try {
        // Brief visual ping — a real notification would need permissions
        if (typeof document !== "undefined") {
          document.title = "⏰ Time's up · SideLootQuest";
          setTimeout(() => {
            document.title = "SideLootQuest — level up your side hustle";
          }, 5000);
        }
      } catch {}
    }
  }, [running, remaining, setContent]);

  function start() {
    const now = Date.now();
    // If we were paused, keep the current remaining
    const base = running ? seconds : remaining;
    setContent({ seconds: base, running: true, lastStartedAt: now });
  }

  function pause() {
    // Freeze remaining into seconds
    setContent({ seconds: remaining, running: false, lastStartedAt: null });
  }

  function reset() {
    const mins = parseInt(durationInput, 10);
    if (Number.isFinite(mins) && mins > 0) {
      setContent({ seconds: mins * 60, running: false, lastStartedAt: null });
    } else {
      setContent({ seconds: 1500, running: false, lastStartedAt: null });
    }
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = Math.max(0, Math.floor(remaining % 60));

  const progress =
    seconds > 0 ? Math.max(0, Math.min(1, 1 - remaining / seconds)) : 0;

  return (
    <div className="flex flex-col items-center gap-3" data-no-drag>
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 34}
            strokeDashoffset={(1 - progress) * 2 * Math.PI * 34}
            className="text-current transition-[stroke-dashoffset]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold tabular-nums">
          {h > 0 ? `${h}:${m.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {running ? (
          <button
            type="button"
            onClick={pause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
            aria-label="Pause"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "bg-black/10 hover:bg-black/20",
            )}
            aria-label="Start"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/15"
          aria-label="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 text-xs opacity-70">
        <input
          type="number"
          min="1"
          max="480"
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          className="w-14 rounded border border-black/10 bg-white/60 px-1.5 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <span>min</span>
      </div>
    </div>
  );
}

function computeRemaining(
  seconds: number,
  running: boolean,
  lastStartedAt: number | null,
): number {
  if (!running || !lastStartedAt) return seconds;
  const elapsed = Math.floor((Date.now() - lastStartedAt) / 1000);
  return Math.max(0, seconds - elapsed);
}
