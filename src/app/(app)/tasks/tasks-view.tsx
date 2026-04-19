"use client";

import * as React from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Plus, Trash2, Calendar, Coins, Clock, Flag, Sparkles } from "lucide-react";
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
  DialogDescription,
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
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";
import { parseTaskInput } from "@/lib/nlp-date";
import { createTask, toggleTask, deleteTask } from "../actions";

type Project = { id: string; name: string; color: string };
type Client = { id: string; name: string };
type TaskRow = {
  id: string;
  title: string;
  completed: boolean;
  dueAt: Date | null;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  billingType: "NONE" | "HOURLY" | "FIXED";
  rateCents: number | null;
  priceCents: number | null;
  project: { id: string; name: string; color: string } | null;
  client: { id: string; name: string } | null;
  timeEntries: { seconds: number }[];
};

const PRIORITY_COLORS: Record<TaskRow["priority"], string> = {
  NONE: "text-muted-foreground",
  LOW: "text-blue-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-red-400",
};

export function TasksView({
  tasks,
  projects,
  clients,
}: {
  tasks: TaskRow[];
  projects: Project[];
  clients: Client[];
}) {
  const [filter, setFilter] = React.useState<"all" | "today" | "overdue" | "hustle">("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "today") {
      return tasks.filter((t) => !t.completed && t.dueAt && isToday(t.dueAt));
    }
    if (filter === "overdue") {
      return tasks.filter((t) => !t.completed && t.dueAt && isPast(t.dueAt) && !isToday(t.dueAt));
    }
    if (filter === "hustle") {
      return tasks.filter((t) => t.billingType !== "NONE");
    }
    return tasks;
  }, [tasks, filter]);

  const openTasks = filtered.filter((t) => !t.completed);
  const doneTasks = filtered.filter((t) => t.completed);

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {openTasks.length} open · {doneTasks.length} done
          </p>
        </div>
        <NewTaskDialog projects={projects} clients={clients} />
      </div>

      <div className="mb-4 flex gap-2">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterTab>
        <FilterTab active={filter === "today"} onClick={() => setFilter("today")}>
          Today
        </FilterTab>
        <FilterTab active={filter === "overdue"} onClick={() => setFilter("overdue")}>
          Overdue
        </FilterTab>
        <FilterTab active={filter === "hustle"} onClick={() => setFilter("hustle")}>
          <Coins className="mr-1 h-3 w-3" /> Hustle
        </FilterTab>
      </div>

      {openTasks.length === 0 && doneTasks.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-[color:var(--gold)]" />
            <p className="text-sm text-muted-foreground">
              No tasks yet. Add your first one to start the quest.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {openTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {doneTasks.length > 0 && (
            <>
              <div className="my-6 flex items-center gap-2 text-xs uppercase text-muted-foreground">
                <span>Done</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {doneTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FilterTab({
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
        "inline-flex items-center rounded-md px-3 py-1 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TaskRow({ task }: { task: TaskRow }) {
  const [pending, startTransition] = React.useTransition();
  const loggedSeconds = task.timeEntries.reduce((acc, e) => acc + e.seconds, 0);

  const potentialRevenue = React.useMemo(() => {
    if (task.billingType === "FIXED") return task.priceCents ?? 0;
    if (task.billingType === "HOURLY" && task.rateCents) {
      return Math.round((task.rateCents * loggedSeconds) / 3600);
    }
    return 0;
  }, [task.billingType, task.rateCents, task.priceCents, loggedSeconds]);

  return (
    <Card className={cn("transition-opacity", task.completed && "opacity-60")}>
      <div className="flex items-start gap-3 p-3">
        <Checkbox
          className="mt-0.5"
          checked={task.completed}
          disabled={pending}
          onCheckedChange={(v) => {
            startTransition(() => toggleTask(task.id, Boolean(v)));
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "break-words text-sm",
                task.completed && "line-through text-muted-foreground",
              )}
            >
              {task.priority !== "NONE" && (
                <Flag className={cn("mr-1 inline h-3.5 w-3.5", PRIORITY_COLORS[task.priority])} />
              )}
              {task.title}
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this task?")) {
                  startTransition(() => deleteTask(task.id));
                }
              }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {task.dueAt && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {formatDue(task.dueAt, task.completed)}
              </Badge>
            )}
            {task.project && (
              <Badge variant="outline" className="gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: task.project.color }}
                />
                {task.project.name}
              </Badge>
            )}
            {task.client && <Badge variant="secondary">{task.client.name}</Badge>}
            {task.billingType === "HOURLY" && task.rateCents && (
              <Badge variant="gold" className="gap-1">
                <Coins className="h-3 w-3" />
                {formatMoney(task.rateCents)}/hr
              </Badge>
            )}
            {task.billingType === "FIXED" && task.priceCents && (
              <Badge variant="gold" className="gap-1">
                <Coins className="h-3 w-3" />
                {formatMoney(task.priceCents)}
              </Badge>
            )}
            {loggedSeconds > 0 && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {(loggedSeconds / 3600).toFixed(1)}h
                {potentialRevenue > 0 && task.billingType === "HOURLY" && (
                  <span className="text-[color:var(--gold)]"> · {formatMoney(potentialRevenue)}</span>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function formatDue(date: Date, completed: boolean): string {
  if (isToday(date)) return `Today ${format(date, "h:mma")}`;
  if (isTomorrow(date)) return `Tomorrow ${format(date, "h:mma")}`;
  if (!completed && isPast(date)) return `Overdue · ${format(date, "MMM d")}`;
  return format(date, "MMM d, h:mma");
}

function NewTaskDialog({ projects, clients }: { projects: Project[]; clients: Client[] }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [billingType, setBillingType] = React.useState<"NONE" | "HOURLY" | "FIXED">("NONE");
  const [rate, setRate] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [clientId, setClientId] = React.useState<string>("");
  const [priority, setPriority] = React.useState<"NONE" | "LOW" | "MEDIUM" | "HIGH">("NONE");
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  // Live preview of NLP date extraction
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
    const formData = new FormData(e.currentTarget);
    formData.set("billingType", billingType);
    formData.set("priority", priority);
    if (projectId) formData.set("projectId", projectId);
    if (clientId) formData.set("clientId", clientId);
    startTransition(async () => {
      await createTask(formData);
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Try: <em>Email Sarah about invoice tomorrow 3pm</em>
          </DialogDescription>
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

          {/* Hustle Mode */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <Label className="mb-2 flex items-center gap-1 text-xs">
              <Coins className="h-3 w-3 text-[color:var(--gold)]" />
              Hustle Mode · revenue tracking
            </Label>
            <div className="flex flex-wrap gap-2">
              <HustleChip
                active={billingType === "NONE"}
                onClick={() => setBillingType("NONE")}
              >
                Not billable
              </HustleChip>
              <HustleChip
                active={billingType === "HOURLY"}
                onClick={() => setBillingType("HOURLY")}
              >
                $/hour
              </HustleChip>
              <HustleChip
                active={billingType === "FIXED"}
                onClick={() => setBillingType("FIXED")}
              >
                Fixed price
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
            <Label className="mb-1 block text-xs">Notes (optional)</Label>
            <Textarea
              name="notes"
              placeholder="Details, links, deliverables..."
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
              {pending ? "Saving…" : "Add to quest"}
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
