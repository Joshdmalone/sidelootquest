"use client";

import * as React from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Plus, Trash2, Calendar, Coins, Clock, Flag, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, formatMoney } from "@/lib/utils";
import { parseTaskInput } from "@/lib/nlp-date";
import {
  createColumn,
  createTask,
  deleteColumn,
  deleteTask,
  moveTask,
  quickCreateTask,
  renameColumn,
  setColumnColor,
  setTaskPriority,
  toggleTask,
  updateTaskTitle,
} from "../actions";

export type KanbanTask = {
  id: string;
  title: string;
  completed: boolean;
  dueAt: string | null;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  billingType: "NONE" | "HOURLY" | "FIXED";
  rateCents: number | null;
  priceCents: number | null;
  columnId: string | null;
  loggedSeconds: number;
  project: { id: string; name: string; color: string } | null;
  client: { id: string; name: string } | null;
};

export type KanbanColumn = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

const COLUMN_COLORS = [
  "#64748b", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6",
];

const PRIORITY_COLORS: Record<KanbanTask["priority"], string> = {
  NONE: "text-muted-foreground",
  LOW: "text-blue-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-red-400",
};

export function KanbanBoard({
  columns,
  tasks,
  projects,
  clients,
}: {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  projects: { id: string; name: string; color: string }[];
  clients: { id: string; name: string }[];
}) {
  const [pending, startTransition] = React.useTransition();

  // Optimistic column state (for add)
  const [dragTaskId, setDragTaskId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);

  const tasksByColumn = React.useMemo(() => {
    const map = new Map<string, KanbanTask[]>();
    for (const c of columns) map.set(c.id, []);
    for (const t of tasks) {
      const arr = map.get(t.columnId ?? "") ?? [];
      arr.push(t);
      if (t.columnId) map.set(t.columnId, arr);
    }
    return map;
  }, [tasks, columns]);

  function handleDragStart(taskId: string) {
    setDragTaskId(taskId);
  }
  function handleDragEnd() {
    setDragTaskId(null);
    setDragOverColumn(null);
  }
  function handleDropOnColumn(columnId: string) {
    if (!dragTaskId) return;
    const task = tasks.find((t) => t.id === dragTaskId);
    setDragOverColumn(null);
    setDragTaskId(null);
    if (!task || task.columnId === columnId) return;
    startTransition(() => moveTask(dragTaskId, columnId));
  }

  const totalOpen = tasks.filter((t) => !t.completed).length;
  const totalDone = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tasks</h1>
          <p className="text-xs text-muted-foreground">
            {totalOpen} open · {totalDone} done · {columns.length} columns · drag to move
          </p>
        </div>
        <NewTaskDialog columns={columns} projects={projects} clients={clients} />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max gap-4 p-4">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasksByColumn.get(col.id) ?? []}
              onDragStartTask={handleDragStart}
              onDragEndTask={handleDragEnd}
              onDropOnColumn={handleDropOnColumn}
              dragOver={dragOverColumn === col.id}
              onDragEnterColumn={() => setDragOverColumn(col.id)}
              onDragLeaveColumn={() => setDragOverColumn((c) => (c === col.id ? null : c))}
              canDelete={columns.length > 1}
              pending={pending}
              startTransition={startTransition}
            />
          ))}
          {/* + column */}
          <div className="w-72 shrink-0">
            <button
              type="button"
              onClick={() => startTransition(() => createColumn())}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              New column
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────

function Column({
  column,
  tasks,
  onDragStartTask,
  onDragEndTask,
  onDropOnColumn,
  dragOver,
  onDragEnterColumn,
  onDragLeaveColumn,
  canDelete,
  pending,
  startTransition,
}: {
  column: KanbanColumn;
  tasks: KanbanTask[];
  onDragStartTask: (taskId: string) => void;
  onDragEndTask: () => void;
  onDropOnColumn: (columnId: string) => void;
  dragOver: boolean;
  onDragEnterColumn: () => void;
  onDragLeaveColumn: () => void;
  canDelete: boolean;
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(column.name);
  const [showMenu, setShowMenu] = React.useState(false);
  // When a newly-created task is awaiting inline edit:
  const [inlineEditTaskId, setInlineEditTaskId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNameDraft(column.name);
  }, [column.name]);

  function commitName() {
    setEditingName(false);
    if (nameDraft.trim() && nameDraft !== column.name) {
      startTransition(() => renameColumn(column.id, nameDraft));
    } else {
      setNameDraft(column.name);
    }
  }

  function handleQuickAdd() {
    startTransition(async () => {
      const created = await quickCreateTask(column.id, "New task");
      setInlineEditTaskId(created.id);
    });
  }

  return (
    <div
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-card transition-colors",
        dragOver && "border-primary bg-accent/30",
      )}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragEnter={() => onDragEnterColumn()}
      onDragLeave={(e) => {
        // Only leave if we're actually leaving the column bounds
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        onDragLeaveColumn();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumn(column.id);
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: column.color }}
        />
        {editingName ? (
          <input
            className="flex-1 rounded-md bg-input px-2 py-0.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoFocus
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setEditingName(false);
                setNameDraft(column.name);
              }
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="flex-1 cursor-text text-left text-sm font-semibold tracking-tight hover:opacity-80"
          >
            {column.name}{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">{tasks.length}</span>
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((s) => !s)}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-border bg-card p-2 text-sm shadow-xl"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingName(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              <div className="my-2 px-2">
                <p className="mb-1 text-xs text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-1">
                  {COLUMN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        startTransition(() => setColumnColor(column.id, c));
                        setShowMenu(false);
                      }}
                      className="h-5 w-5 rounded ring-offset-card transition-all hover:scale-110"
                      style={{
                        background: c,
                        outline: c === column.color ? `2px solid ${c}` : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete column "${column.name}"? Tasks move to the first column.`)) {
                      startTransition(() => deleteColumn(column.id));
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete column
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={() => onDragStartTask(task.id)}
            onDragEnd={onDragEndTask}
            pending={pending}
            startTransition={startTransition}
            editInline={inlineEditTaskId === task.id}
            onInlineEditDone={() => setInlineEditTaskId(null)}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">Drop tasks here.</p>
        )}
      </div>

      {/* Quick add */}
      <button
        type="button"
        onClick={handleQuickAdd}
        disabled={pending}
        className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add task
      </button>
    </div>
  );
}

// ─── Task card ─────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  pending,
  startTransition,
  editInline,
  onInlineEditDone,
}: {
  task: KanbanTask;
  onDragStart: () => void;
  onDragEnd: () => void;
  pending: boolean;
  startTransition: React.TransitionStartFunction;
  editInline: boolean;
  onInlineEditDone: () => void;
}) {
  const [editing, setEditing] = React.useState(editInline);
  const [draft, setDraft] = React.useState(task.title);

  React.useEffect(() => {
    if (editInline) setEditing(true);
  }, [editInline]);

  React.useEffect(() => setDraft(task.title), [task.title]);

  function commitTitle() {
    setEditing(false);
    onInlineEditDone();
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) {
      startTransition(() => updateTaskTitle(task.id, trimmed));
    } else {
      setDraft(task.title);
    }
  }

  const preview = React.useMemo(() => parseTaskInput(draft), [draft]);

  const loggedSeconds = task.loggedSeconds;
  const potentialRevenue = React.useMemo(() => {
    if (task.billingType === "FIXED") return task.priceCents ?? 0;
    if (task.billingType === "HOURLY" && task.rateCents) {
      return Math.round((task.rateCents * loggedSeconds) / 3600);
    }
    return 0;
  }, [task.billingType, task.rateCents, task.priceCents, loggedSeconds]);

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border border-border bg-background p-2.5 text-sm shadow-sm transition-all",
        task.completed && "opacity-50",
        !editing && "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          className="mt-0.5 shrink-0"
          checked={task.completed}
          disabled={pending}
          onCheckedChange={(v) => {
            startTransition(() => toggleTask(task.id, Boolean(v)));
          }}
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setDraft(task.title);
                    setEditing(false);
                    onInlineEditDone();
                  }
                }}
                className="w-full rounded-md bg-input px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {preview.dueAt && (
                <p className="mt-1 text-xs text-[color:var(--gold)]">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  {format(preview.dueAt, "EEE MMM d, h:mma")}
                </p>
              )}
            </div>
          ) : (
            <p
              onClick={() => setEditing(true)}
              className={cn(
                "cursor-text break-words",
                task.completed && "line-through text-muted-foreground",
              )}
            >
              {task.priority !== "NONE" && (
                <Flag className={cn("mr-1 inline h-3 w-3", PRIORITY_COLORS[task.priority])} />
              )}
              {task.title}
            </p>
          )}

          {!editing && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {task.dueAt && (
                <DueBadge dueAt={new Date(task.dueAt)} completed={task.completed} />
              )}
              {task.project && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: task.project.color }}
                  />
                  {task.project.name}
                </Badge>
              )}
              {task.client && (
                <Badge variant="secondary" className="text-[10px]">
                  {task.client.name}
                </Badge>
              )}
              {task.billingType === "HOURLY" && task.rateCents && (
                <Badge variant="gold" className="gap-1 text-[10px]">
                  <Coins className="h-2.5 w-2.5" />
                  {formatMoney(task.rateCents)}/hr
                </Badge>
              )}
              {task.billingType === "FIXED" && task.priceCents && (
                <Badge variant="gold" className="gap-1 text-[10px]">
                  <Coins className="h-2.5 w-2.5" />
                  {formatMoney(task.priceCents)}
                </Badge>
              )}
              {loggedSeconds > 0 && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Clock className="h-2.5 w-2.5" />
                  {(loggedSeconds / 3600).toFixed(1)}h
                  {potentialRevenue > 0 && task.billingType === "HOURLY" && (
                    <span className="text-[color:var(--gold)]">
                      {" "}
                      · {formatMoney(potentialRevenue)}
                    </span>
                  )}
                </Badge>
              )}
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <TaskPriorityMenu task={task} startTransition={startTransition} />
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this task?")) startTransition(() => deleteTask(task.id));
              }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskPriorityMenu({
  task,
  startTransition,
}: {
  task: KanbanTask;
  startTransition: React.TransitionStartFunction;
}) {
  const [open, setOpen] = React.useState(false);
  const colorMap: Record<KanbanTask["priority"], string> = {
    NONE: "text-muted-foreground",
    LOW: "text-blue-400",
    MEDIUM: "text-amber-400",
    HIGH: "text-red-400",
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn("hover:opacity-100", colorMap[task.priority])}
        aria-label="Set priority"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-5 z-20 flex flex-col rounded-md border border-border bg-card p-1 shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          {(["NONE", "LOW", "MEDIUM", "HIGH"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                startTransition(() => setTaskPriority(task.id, p));
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent",
                colorMap[p],
              )}
            >
              <Flag className="h-3 w-3" /> {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DueBadge({ dueAt, completed }: { dueAt: Date; completed: boolean }) {
  let label: string;
  let variant: "outline" | "danger" | "gold" = "outline";
  if (isToday(dueAt)) {
    label = `Today ${format(dueAt, "h:mma")}`;
    variant = "gold";
  } else if (isTomorrow(dueAt)) {
    label = `Tomorrow ${format(dueAt, "h:mma")}`;
  } else if (!completed && isPast(dueAt)) {
    label = `Overdue · ${format(dueAt, "MMM d")}`;
    variant = "danger";
  } else {
    label = format(dueAt, "MMM d, h:mma");
  }
  return (
    <Badge variant={variant} className="gap-1 text-[10px]">
      <Calendar className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}

// ─── Full new-task dialog (with all fields) ────────────────────────────────

function NewTaskDialog({
  columns,
  projects,
  clients,
}: {
  columns: KanbanColumn[];
  projects: { id: string; name: string; color: string }[];
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [billingType, setBillingType] = React.useState<"NONE" | "HOURLY" | "FIXED">("NONE");
  const [rate, setRate] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [clientId, setClientId] = React.useState<string>("");
  const [columnId, setColumnId] = React.useState<string>(columns[0]?.id ?? "");
  const [priority, setPriority] = React.useState<"NONE" | "LOW" | "MEDIUM" | "HIGH">("NONE");
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const preview = React.useMemo(() => parseTaskInput(title), [title]);

  function reset() {
    setTitle("");
    setBillingType("NONE");
    setRate("");
    setPrice("");
    setProjectId("");
    setClientId("");
    setPriority("NONE");
    setNotes("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("billingType", billingType);
    fd.set("priority", priority);
    if (projectId) fd.set("projectId", projectId);
    if (clientId) fd.set("clientId", clientId);
    if (columnId) fd.set("columnId", columnId);
    startTransition(async () => {
      await createTask(fd);
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="sm">
          <Plus className="h-4 w-4" /> Detailed task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Try: <em>Email Sarah about invoice tomorrow 3pm</em>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              name="title"
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
            {title && preview.dueAt && (
              <p className="mt-1 text-xs text-[color:var(--gold)]">
                <Calendar className="mr-1 inline h-3 w-3" />
                Due: {format(preview.dueAt, "EEE MMM d, h:mma")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs">Column</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="(none)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">(none)</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="(none)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">(none)</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hustle Mode */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <Label className="mb-2 flex items-center gap-1 text-xs">
              <Coins className="h-3 w-3 text-[color:var(--gold)]" />
              Hustle Mode · revenue tracking
            </Label>
            <div className="flex flex-wrap gap-2">
              <HustleChip active={billingType === "NONE"} onClick={() => setBillingType("NONE")}>
                Not billable
              </HustleChip>
              <HustleChip active={billingType === "HOURLY"} onClick={() => setBillingType("HOURLY")}>
                $/hour
              </HustleChip>
              <HustleChip active={billingType === "FIXED"} onClick={() => setBillingType("FIXED")}>
                Fixed
              </HustleChip>
            </div>
            {billingType === "HOURLY" && (
              <div className="mt-3">
                <Label className="mb-1 block text-xs">Hourly rate ($)</Label>
                <Input
                  name="rateDollars"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="75"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            )}
            {billingType === "FIXED" && (
              <div className="mt-3">
                <Label className="mb-1 block text-xs">Fixed price ($)</Label>
                <Input
                  name="priceDollars"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1 block text-xs">Notes</Label>
            <Textarea
              name="notes"
              placeholder="Details, links, deliverables…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="gold" disabled={pending || !title.trim()}>
              {pending ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HustleChip({
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
        "rounded-md border px-3 py-1 text-xs transition-colors",
        active
          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

