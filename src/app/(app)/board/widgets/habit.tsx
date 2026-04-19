"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";

export function HabitWidget({
  content,
  setContent,
}: {
  content: Record<string, unknown>;
  setContent: (c: Record<string, unknown>) => void;
}) {
  const days = Array.isArray(content.days) ? (content.days as boolean[]) : new Array(7).fill(false);
  const label = typeof content.label === "string" ? content.label : "Habit";

  const done = days.filter(Boolean).length;
  const pct = days.length > 0 ? (done / days.length) * 100 : 0;

  function toggle(i: number) {
    const next = [...days];
    next[i] = !next[i];
    setContent({ days: next, label });
  }

  function adjust(delta: number) {
    const next = [...days];
    if (delta > 0 && next.length < 31) next.push(false);
    else if (delta < 0 && next.length > 1) next.pop();
    setContent({ days: next, label });
  }

  function updateLabel(v: string) {
    setContent({ days, label: v.slice(0, 60) });
  }

  const circumference = 226.19; // 2πr where r=36
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-3" data-no-drag>
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
          {Math.round(pct)}%
        </div>
      </div>

      <input
        value={label}
        onChange={(e) => updateLabel(e.target.value)}
        placeholder="Habit name"
        className="w-full rounded-md border border-black/10 bg-white/60 px-2 py-1 text-center text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/20"
      />

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className="flex h-5 w-5 items-center justify-center rounded border border-black/20 transition-colors"
            style={{
              background: d ? "currentColor" : "transparent",
              color: d ? "#0f172a" : "inherit",
            }}
            aria-label={`Day ${i + 1}`}
          >
            {d && (
              <svg viewBox="0 0 12 12" className="h-3 w-3" style={{ color: "white" }}>
                <path
                  d="M2 6l3 3 5-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[10px] opacity-70">
        <button
          type="button"
          onClick={() => adjust(-1)}
          className="flex h-5 w-5 items-center justify-center rounded border border-black/15 hover:bg-black/10"
        >
          <Minus className="h-2.5 w-2.5" />
        </button>
        <span>{days.length} days</span>
        <button
          type="button"
          onClick={() => adjust(1)}
          className="flex h-5 w-5 items-center justify-center rounded border border-black/15 hover:bg-black/10"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}
