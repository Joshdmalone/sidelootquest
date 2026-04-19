"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { text: string; done: boolean };

export function QuickTasksWidget({
  content,
  setContent,
}: {
  content: Record<string, unknown>;
  setContent: (c: Record<string, unknown>) => void;
}) {
  const items: Item[] = Array.isArray(content.items) ? (content.items as Item[]) : [];
  const [draft, setDraft] = React.useState("");

  function add() {
    if (!draft.trim()) return;
    setContent({ items: [...items, { text: draft.trim(), done: false }] });
    setDraft("");
  }

  function toggle(i: number) {
    const next = items.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it));
    setContent({ items: next });
  }

  function remove(i: number) {
    setContent({ items: items.filter((_, idx) => idx !== i) });
  }

  function editText(i: number, text: string) {
    const next = items.map((it, idx) => (idx === i ? { ...it, text } : it));
    setContent({ items: next });
  }

  const done = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-2" data-no-drag>
      <div className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Add task…"
          className="flex-1 rounded-md border border-black/10 bg-white/60 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-6 w-6 items-center justify-center rounded bg-black/10 hover:bg-black/20"
          aria-label="Add"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <p className="py-3 text-center text-[10px] italic opacity-60">No items yet.</p>
        ) : (
          items.map((it, i) => (
            <div key={i} className="group flex items-center gap-1.5 py-0.5 text-xs">
              <input
                type="checkbox"
                checked={it.done}
                onChange={() => toggle(i)}
                className="h-3.5 w-3.5 rounded accent-current"
              />
              <input
                value={it.text}
                onChange={(e) => editText(i, e.target.value)}
                className={cn(
                  "flex-1 border-none bg-transparent px-1 focus:outline-none focus:ring-1 focus:ring-black/20",
                  it.done && "line-through opacity-50",
                )}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <p className="border-t border-black/10 pt-1.5 text-[10px] opacity-60">
          {done} / {items.length} done
        </p>
      )}
    </div>
  );
}
