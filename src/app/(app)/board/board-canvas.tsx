"use client";

import * as React from "react";
import {
  StickyNote,
  Brush,
  Timer as TimerIcon,
  Droplets,
  ListChecks,
  Home,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createWidget as createWidgetAction,
  updateWidgetPosition,
  updateWidgetContent,
  deleteWidget as deleteWidgetAction,
} from "../actions";
import { NoteWidget } from "./widgets/note";
import { WhiteboardWidget } from "./widgets/whiteboard";
import { TimerWidget } from "./widgets/timer";
import { HabitWidget } from "./widgets/habit";
import { QuickTasksWidget } from "./widgets/quick-tasks";

export type WidgetRecord = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  title: string;
  content: string;
};

const CANVAS_SIZE = 8000;
const CANVAS_CENTER = CANVAS_SIZE / 2;

const TOOLS: {
  type: "note" | "whiteboard" | "timer" | "habit" | "quick-tasks";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "note", label: "Note", icon: StickyNote },
  { type: "whiteboard", label: "Whiteboard", icon: Brush },
  { type: "timer", label: "Timer", icon: TimerIcon },
  { type: "habit", label: "Habit", icon: Droplets },
  { type: "quick-tasks", label: "Tasks", icon: ListChecks },
];

export function BoardCanvas({ initialWidgets }: { initialWidgets: WidgetRecord[] }) {
  const [widgets, setWidgets] = React.useState<WidgetRecord[]>(initialWidgets);
  const [zoom, setZoom] = React.useState(1);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [isPanning, setIsPanning] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const maxZIndex = React.useRef(
    initialWidgets.reduce((m, w) => Math.max(m, w.zIndex), 0),
  );
  const tempIdCounter = React.useRef(0);

  // Center the canvas on mount
  React.useEffect(() => {
    if (!viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    setPanX(clientWidth / 2 - CANVAS_CENTER);
    setPanY(clientHeight / 2 - CANVAS_CENTER);
  }, []);

  // Wheel zoom (ctrl/meta + wheel OR trackpad pinch)
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      // Panning with regular wheel, zoom with ctrl/meta
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom((z) => Math.min(Math.max(0.2, z + delta), 2.5));
      } else {
        setPanX((x) => x - e.deltaX);
        setPanY((y) => y - e.deltaY);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Pan with middle mouse or background drag
  const onViewportMouseDown = (e: React.MouseEvent) => {
    const isMiddle = e.button === 1;
    const isLeftOnBg =
      e.button === 0 &&
      (e.target === viewportRef.current ||
        (e.target as HTMLElement).dataset?.role === "canvas-bg");
    if (isMiddle || isLeftOnBg) {
      setIsPanning(true);
    }
  };

  React.useEffect(() => {
    if (!isPanning) return;
    const move = (e: MouseEvent) => {
      setPanX((x) => x + e.movementX);
      setPanY((y) => y + e.movementY);
    };
    const up = () => setIsPanning(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [isPanning]);

  function resetView() {
    if (!viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    setZoom(1);
    setPanX(clientWidth / 2 - CANVAS_CENTER);
    setPanY(clientHeight / 2 - CANVAS_CENTER);
  }

  function changeZoom(delta: number) {
    setZoom((z) => Math.min(Math.max(0.2, z + delta), 2.5));
  }

  // Spawn a new widget centered in the current view
  async function spawn(type: (typeof TOOLS)[number]["type"]) {
    if (!viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    const vX = (clientWidth / 2 - panX) / zoom;
    const vY = (clientHeight / 2 - panY) / zoom;
    const x = Math.round(vX - 160);
    const y = Math.round(vY - 130);

    // Optimistic insert
    tempIdCounter.current += 1;
    const tempId = `tmp-${tempIdCounter.current}`;
    const placeholder: WidgetRecord = {
      id: tempId,
      type,
      x,
      y,
      width: 320,
      height: 260,
      zIndex: ++maxZIndex.current,
      color: "#ffffff",
      title: "",
      content: "{}",
    };
    setWidgets((ws) => [...ws, placeholder]);

    try {
      const created = await createWidgetAction(type, x, y);
      setWidgets((ws) =>
        ws.map((w) =>
          w.id === tempId
            ? {
                id: created.id,
                type: created.type,
                x: created.x,
                y: created.y,
                width: created.width,
                height: created.height,
                zIndex: created.zIndex,
                color: created.color,
                title: created.title,
                content: created.content,
              }
            : w,
        ),
      );
    } catch (err) {
      console.error(err);
      setWidgets((ws) => ws.filter((w) => w.id !== tempId));
    }
  }

  // Widget callbacks
  const updatePosition = React.useCallback(
    (
      id: string,
      data: { x?: number; y?: number; width?: number; height?: number; zIndex?: number },
    ) => {
      setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...data } : w)));
      // Fire-and-forget save
      if (!id.startsWith("tmp-")) {
        updateWidgetPosition(id, data).catch(console.error);
      }
    },
    [],
  );

  const updateContent = React.useCallback(
    (id: string, updates: { title?: string; color?: string; content?: string }) => {
      setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...updates } : w)));
      if (!id.startsWith("tmp-")) {
        updateWidgetContent(id, updates).catch(console.error);
      }
    },
    [],
  );

  const deleteWidgetLocal = React.useCallback((id: string) => {
    setWidgets((ws) => ws.filter((w) => w.id !== id));
    if (!id.startsWith("tmp-")) {
      deleteWidgetAction(id).catch(console.error);
    }
  }, []);

  const bringToFront = React.useCallback(
    (id: string) => {
      maxZIndex.current += 1;
      updatePosition(id, { zIndex: maxZIndex.current });
    },
    [updatePosition],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Viewport */}
      <div
        ref={viewportRef}
        className={cn(
          "relative h-full w-full select-none",
          isPanning ? "cursor-grabbing" : "cursor-grab",
        )}
        onMouseDown={onViewportMouseDown}
      >
        <div
          data-role="canvas-bg"
          className="canvas-grid absolute"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {widgets.map((w) => (
            <WidgetHost
              key={w.id}
              widget={w}
              zoom={zoom}
              onUpdatePosition={updatePosition}
              onUpdateContent={updateContent}
              onDelete={deleteWidgetLocal}
              onFocus={bringToFront}
            />
          ))}
        </div>
      </div>

      {/* Tool palette — floating top-left */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-4 top-4 flex flex-col gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur">
          <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Add
          </p>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => spawn(t.type)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Icon className="h-4 w-4 text-primary" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Zoom + center controls — bottom-center */}
        <div className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={resetView}
            title="Center"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => changeZoom(-0.1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => changeZoom(0.1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Help hint top-right */}
        <div className="pointer-events-auto absolute right-4 top-4 rounded-lg border border-border bg-card/95 px-3 py-2 text-[11px] text-muted-foreground shadow-xl backdrop-blur">
          <p><kbd className="rounded bg-muted px-1">Scroll</kbd> pan · <kbd className="rounded bg-muted px-1">Ctrl+Scroll</kbd> zoom · <kbd className="rounded bg-muted px-1">Drag BG</kbd> pan</p>
        </div>
      </div>
    </div>
  );
}

// ─── Widget host (handles dragging + chrome around each widget body) ─────────

function WidgetHost({
  widget,
  zoom,
  onUpdatePosition,
  onUpdateContent,
  onDelete,
  onFocus,
}: {
  widget: WidgetRecord;
  zoom: number;
  onUpdatePosition: (
    id: string,
    data: { x?: number; y?: number; width?: number; height?: number; zIndex?: number },
  ) => void;
  onUpdateContent: (
    id: string,
    updates: { title?: string; color?: string; content?: string },
  ) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
}) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Drag via the header strip
  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Don't initiate drag if the click is on an interactive element inside the header
    if (target.closest("[data-no-drag]")) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus(widget.id);
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = widget.x;
    const origY = widget.y;

    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      onUpdatePosition(widget.id, {
        x: Math.round(origX + dx),
        y: Math.round(origY + dy),
      });
    };
    const up = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Parse content safely
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(widget.content || "{}");
  } catch {
    parsed = {};
  }

  function setContent(next: Record<string, unknown>) {
    onUpdateContent(widget.id, { content: JSON.stringify(next) });
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        "absolute rounded-xl border border-border shadow-lg transition-shadow",
        isDragging && "shadow-2xl ring-2 ring-primary/50",
      )}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        minHeight: widget.height,
        background: widget.color,
        color: pickTextColor(widget.color),
        zIndex: widget.zIndex,
      }}
      onMouseDown={() => onFocus(widget.id)}
    >
      {/* Header strip (drag handle + title + actions) */}
      <div
        className="flex cursor-grab items-center gap-2 border-b border-black/10 px-3 py-1.5 active:cursor-grabbing"
        onMouseDown={startDrag}
      >
        <input
          data-no-drag
          value={widget.title}
          onChange={(e) => onUpdateContent(widget.id, { title: e.target.value })}
          placeholder={placeholderForType(widget.type)}
          className="flex-1 bg-transparent text-xs font-bold uppercase tracking-wider focus:outline-none"
          style={{ color: pickTextColor(widget.color) }}
        />
        <div data-no-drag className="flex items-center gap-1">
          <ColorPicker
            current={widget.color}
            onPick={(color) => onUpdateContent(widget.id, { color })}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this widget?")) onDelete(widget.id);
            }}
            className="rounded p-1 text-black/40 hover:bg-black/10 hover:text-red-600"
            aria-label="Delete widget"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body by widget type */}
      <div className="p-3">
        {widget.type === "note" && (
          <NoteWidget
            content={parsed}
            setContent={setContent}
            textColor={pickTextColor(widget.color)}
          />
        )}
        {widget.type === "whiteboard" && (
          <WhiteboardWidget content={parsed} setContent={setContent} width={widget.width - 24} />
        )}
        {widget.type === "timer" && <TimerWidget content={parsed} setContent={setContent} />}
        {widget.type === "habit" && <HabitWidget content={parsed} setContent={setContent} />}
        {widget.type === "quick-tasks" && (
          <QuickTasksWidget content={parsed} setContent={setContent} />
        )}
      </div>
    </div>
  );
}

function placeholderForType(type: string): string {
  switch (type) {
    case "note":
      return "Note";
    case "whiteboard":
      return "Whiteboard";
    case "timer":
      return "Timer";
    case "habit":
      return "Habit";
    case "quick-tasks":
      return "Tasks";
    default:
      return "Widget";
  }
}

const WIDGET_COLORS = [
  "#ffffff", "#fef9c3", "#dcfce7", "#dbeafe", "#fee2e2",
  "#f3e8ff", "#ffedd5", "#e0f2fe", "#f1f5f9", "#fae8ff",
];

function ColorPicker({ current, onPick }: { current: string; onPick: (c: string) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="h-4 w-4 rounded border border-black/20"
        style={{ background: current }}
        aria-label="Change color"
      />
      {open && (
        <div
          className="absolute right-0 top-6 z-10 grid grid-cols-5 gap-1 rounded-lg border border-border bg-card p-2 shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          {WIDGET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
              className="h-5 w-5 rounded border border-black/20 hover:scale-110"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Pick black or white foreground to stay legible on a given bg. */
function pickTextColor(hex: string): string {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#0f172a" : "#ffffff";
  } catch {
    return "#0f172a";
  }
}
