"use client";

import * as React from "react";
import { Pencil, Eraser, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Stroke = {
  color: string;
  width: number;
  points: [number, number][];
};

const PEN_COLORS = ["#0f172a", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7"];
const PEN_WIDTHS = [2, 4, 8];

export function WhiteboardWidget({
  content,
  setContent,
  width,
}: {
  content: Record<string, unknown>;
  setContent: (c: Record<string, unknown>) => void;
  width: number;
}) {
  const rawStrokes = Array.isArray(content.strokes) ? (content.strokes as Stroke[]) : [];
  const [strokes, setStrokes] = React.useState<Stroke[]>(rawStrokes);
  const [tool, setTool] = React.useState<"pen" | "eraser">("pen");
  const [color, setColor] = React.useState("#0f172a");
  const [penWidth, setPenWidth] = React.useState(2);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const currentStrokeRef = React.useRef<Stroke | null>(null);
  const [, force] = React.useReducer((x) => x + 1, 0);
  const saveTimerRef = React.useRef<number | null>(null);

  // Keep local in sync if outside content changes (e.g. reset)
  React.useEffect(() => {
    setStrokes(rawStrokes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rawStrokes)]);

  function save(next: Stroke[]) {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setContent({ strokes: next });
    }, 400);
  }

  function pointFromEvent(e: React.PointerEvent): [number, number] {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100,
    ];
  }

  function startStroke(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = pointFromEvent(e);
    if (tool === "pen") {
      currentStrokeRef.current = { color, width: penWidth, points: [p] };
    } else {
      // eraser: remove any stroke whose bounding box contains the point
      const next = strokes.filter((s) => !strokeHitsPoint(s, p));
      setStrokes(next);
      save(next);
    }
  }

  function moveStroke(e: React.PointerEvent) {
    if (!currentStrokeRef.current && tool !== "eraser") return;
    const p = pointFromEvent(e);
    if (tool === "pen" && currentStrokeRef.current) {
      currentStrokeRef.current.points.push(p);
      force();
    } else if (tool === "eraser" && (e.buttons & 1) === 1) {
      const next = strokes.filter((s) => !strokeHitsPoint(s, p));
      if (next.length !== strokes.length) {
        setStrokes(next);
        save(next);
      }
    }
  }

  function endStroke() {
    if (tool === "pen" && currentStrokeRef.current) {
      const next = [...strokes, currentStrokeRef.current];
      currentStrokeRef.current = null;
      setStrokes(next);
      save(next);
    }
  }

  function clearAll() {
    if (!confirm("Clear the whole board?")) return;
    setStrokes([]);
    setContent({ strokes: [] });
  }

  const height = Math.round(width * 0.6);
  const current = currentStrokeRef.current;

  return (
    <div className="flex flex-col gap-2" data-no-drag>
      <div className="flex flex-wrap items-center gap-2">
        <ToolBtn active={tool === "pen"} onClick={() => setTool("pen")}>
          <Pencil className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")}>
          <Eraser className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="mx-1 h-4 w-px bg-black/20" />
        <div className="flex gap-1">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              className={cn(
                "h-4 w-4 rounded-full border border-black/20 transition-transform",
                color === c && tool === "pen" && "scale-125 ring-2 ring-offset-1",
              )}
              style={{ background: c }}
              aria-label={`Pen color ${c}`}
            />
          ))}
        </div>
        <div className="mx-1 h-4 w-px bg-black/20" />
        <div className="flex gap-1">
          {PEN_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                setPenWidth(w);
                setTool("pen");
              }}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors",
                penWidth === w && tool === "pen"
                  ? "bg-black/15"
                  : "hover:bg-black/10",
              )}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={clearAll}
          className="rounded p-1 text-black/50 hover:bg-red-500/10 hover:text-red-600"
          aria-label="Clear"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        width="100%"
        style={{ height, touchAction: "none" }}
        className="rounded-lg border border-black/10 bg-white"
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      >
        {strokes.map((s, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width / 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={s.points.map((p) => p.join(",")).join(" ")}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {current && current.points.length > 0 && (
          <polyline
            fill="none"
            stroke={current.color}
            strokeWidth={current.width / 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={current.points.map((p) => p.join(",")).join(" ")}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active ? "bg-black/15 text-black" : "text-black/60 hover:bg-black/10",
      )}
    >
      {children}
    </button>
  );
}

function strokeHitsPoint(stroke: Stroke, p: [number, number]): boolean {
  const r = Math.max(2, stroke.width / 2);
  for (const [x, y] of stroke.points) {
    if (Math.abs(x - p[0]) < r && Math.abs(y - p[1]) < r) return true;
  }
  return false;
}
