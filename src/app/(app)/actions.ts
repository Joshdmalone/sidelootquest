"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTaskInput } from "@/lib/nlp-date";

// ---------------------------------------------------------------------------
// Kanban columns
// ---------------------------------------------------------------------------

const DEFAULT_COLUMNS: { name: string; color: string }[] = [
  { name: "To Do", color: "#64748b" },
  { name: "Doing", color: "#8b5cf6" },
  { name: "Done", color: "#10b981" },
];

/** Ensure the user has at least the default Kanban columns. Idempotent. */
export async function ensureDefaultColumns(userId: string): Promise<void> {
  const count = await prisma.taskColumn.count({ where: { userId } });
  if (count > 0) return;
  for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
    const c = DEFAULT_COLUMNS[i];
    await prisma.taskColumn.create({
      data: { userId, name: c.name, color: c.color, sortOrder: i },
    });
  }
  // Back-fill: any pre-existing tasks without a column → first column
  const firstCol = await prisma.taskColumn.findFirst({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });
  if (firstCol) {
    await prisma.task.updateMany({
      where: { userId, columnId: null },
      data: { columnId: firstCol.id },
    });
  }
}

export async function createColumn(name?: string) {
  const user = await requireUser();
  const maxOrder = await prisma.taskColumn.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  });
  await prisma.taskColumn.create({
    data: {
      userId: user.id,
      name: (name?.trim() || "New column").slice(0, 80),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/tasks");
}

export async function renameColumn(columnId: string, name: string) {
  const user = await requireUser();
  await prisma.taskColumn.updateMany({
    where: { id: columnId, userId: user.id },
    data: { name: name.trim().slice(0, 80) || "Column" },
  });
  revalidatePath("/tasks");
}

export async function setColumnColor(columnId: string, color: string) {
  const user = await requireUser();
  await prisma.taskColumn.updateMany({
    where: { id: columnId, userId: user.id },
    data: { color },
  });
  revalidatePath("/tasks");
}

export async function deleteColumn(columnId: string) {
  const user = await requireUser();
  // Move the column's tasks to the first remaining column
  const fallback = await prisma.taskColumn.findFirst({
    where: { userId: user.id, id: { not: columnId } },
    orderBy: { sortOrder: "asc" },
  });
  if (!fallback) {
    throw new Error("Can't delete the last column.");
  }
  await prisma.task.updateMany({
    where: { columnId, userId: user.id },
    data: { columnId: fallback.id },
  });
  await prisma.taskColumn.deleteMany({ where: { id: columnId, userId: user.id } });
  revalidatePath("/tasks");
}

export async function reorderColumns(columnIds: string[]) {
  const user = await requireUser();
  await Promise.all(
    columnIds.map((id, i) =>
      prisma.taskColumn.updateMany({
        where: { id, userId: user.id },
        data: { sortOrder: i },
      }),
    ),
  );
  revalidatePath("/tasks");
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  columnId: z.string().optional().nullable(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  billingType: z.enum(["NONE", "HOURLY", "FIXED"]).default("NONE"),
  rateDollars: z.coerce.number().nonnegative().optional(),
  priceDollars: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(5000).optional().nullable(),
});

/** Full form task creation (used from task detail dialog). */
export async function createTask(formData: FormData) {
  const user = await requireUser();
  await ensureDefaultColumns(user.id);
  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateTaskSchema.parse({
    ...raw,
    projectId: raw.projectId || null,
    clientId: raw.clientId || null,
    columnId: raw.columnId || null,
    notes: raw.notes || null,
  });

  const { title, dueAt } = parseTaskInput(parsed.title);

  // If no column specified, use first column
  let columnId = parsed.columnId;
  if (!columnId) {
    const first = await prisma.taskColumn.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
    });
    columnId = first?.id ?? null;
  }

  await prisma.task.create({
    data: {
      userId: user.id,
      title,
      notes: parsed.notes,
      dueAt,
      priority: parsed.priority,
      projectId: parsed.projectId || null,
      clientId: parsed.clientId || null,
      columnId,
      billingType: parsed.billingType,
      rateCents:
        parsed.billingType === "HOURLY" && parsed.rateDollars
          ? Math.round(parsed.rateDollars * 100)
          : null,
      priceCents:
        parsed.billingType === "FIXED" && parsed.priceDollars
          ? Math.round(parsed.priceDollars * 100)
          : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/loot");
}

/** One-click Kanban task creation. Creates an empty task in the column and
 *  returns it so the client can focus-edit it inline. */
export async function quickCreateTask(columnId: string, title = "New task") {
  const user = await requireUser();
  // Verify column ownership
  const col = await prisma.taskColumn.findFirst({
    where: { id: columnId, userId: user.id },
  });
  if (!col) throw new Error("Column not found");

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      columnId,
      title: title.trim() || "New task",
      priority: "NONE",
      billingType: "NONE",
    },
  });
  revalidatePath("/tasks");
  return { id: task.id, title: task.title };
}

export async function updateTaskTitle(taskId: string, title: string) {
  const user = await requireUser();
  const cleaned = title.trim().slice(0, 500) || "Untitled";

  // Re-parse NLP date from updated title — nice touch
  const parsed = parseTaskInput(cleaned);
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: {
      title: parsed.title,
      dueAt: parsed.dueAt,
    },
  });
  revalidatePath("/tasks");
}

export async function moveTask(taskId: string, columnId: string) {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: { columnId },
  });
  revalidatePath("/tasks");
}

export async function toggleTask(taskId: string, completed: boolean) {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/loot");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  await prisma.task.deleteMany({ where: { id: taskId, userId: user.id } });
  revalidatePath("/tasks");
  revalidatePath("/loot");
}

export async function setTaskPriority(
  taskId: string,
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH",
) {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: { priority },
  });
  revalidatePath("/tasks");
}

export async function setTaskBilling(
  taskId: string,
  billingType: "NONE" | "HOURLY" | "FIXED",
  rateDollars?: number,
  priceDollars?: number,
) {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: {
      billingType,
      rateCents: billingType === "HOURLY" && rateDollars ? Math.round(rateDollars * 100) : null,
      priceCents: billingType === "FIXED" && priceDollars ? Math.round(priceDollars * 100) : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/loot");
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const ProjectSchema = z.object({
  name: z.string().min(1).max(200),
  color: z.string().default("#8b5cf6"),
  clientId: z.string().optional().nullable(),
});

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectSchema.parse({
    ...raw,
    clientId: raw.clientId || null,
  });

  await prisma.project.create({
    data: {
      userId: user.id,
      name: parsed.name,
      color: parsed.color,
      clientId: parsed.clientId,
    },
  });
  revalidatePath("/projects");
  revalidatePath("/tasks");
}

export async function deleteProject(projectId: string) {
  const user = await requireUser();
  await prisma.project.deleteMany({ where: { id: projectId, userId: user.id } });
  revalidatePath("/projects");
  revalidatePath("/tasks");
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const ClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ClientSchema.parse(raw);
  await prisma.client.create({
    data: {
      userId: user.id,
      name: parsed.name,
      email: parsed.email || null,
      notes: parsed.notes || null,
    },
  });
  revalidatePath("/clients");
  revalidatePath("/tasks");
}

export async function deleteClient(clientId: string) {
  const user = await requireUser();
  await prisma.client.deleteMany({ where: { id: clientId, userId: user.id } });
  revalidatePath("/clients");
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const SettingsSchema = z.object({
  taxRatePct: z.coerce.number().min(0).max(60),
  weeklyGoalDollars: z.coerce.number().min(0),
  timezone: z.string().default("America/New_York"),
});

export async function updateSettings(formData: FormData) {
  const user = await requireUser();
  const parsed = SettingsSchema.parse(Object.fromEntries(formData.entries()));
  await prisma.user.update({
    where: { id: user.id },
    data: {
      taxRatePct: parsed.taxRatePct,
      weeklyGoalCents: Math.round(parsed.weeklyGoalDollars * 100),
      timezone: parsed.timezone,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/loot");
}

export async function setTheme(theme: "light" | "dark" | "system") {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { theme },
  });
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Time entries
// ---------------------------------------------------------------------------

export async function startTimer(kind: "focus" | "billable", taskId?: string) {
  const user = await requireUser();
  await prisma.timeEntry.updateMany({
    where: { userId: user.id, endedAt: null },
    data: { endedAt: new Date() },
  });
  const entry = await prisma.timeEntry.create({
    data: {
      userId: user.id,
      kind,
      taskId: taskId || null,
      startedAt: new Date(),
    },
  });
  revalidatePath("/focus");
  return { id: entry.id, startedAt: entry.startedAt };
}

export async function stopTimer(entryId: string) {
  const user = await requireUser();
  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, userId: user.id },
  });
  if (!entry || entry.endedAt) return;
  const endedAt = new Date();
  const seconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - entry.startedAt.getTime()) / 1000),
  );
  await prisma.timeEntry.update({
    where: { id: entryId },
    data: { endedAt, seconds },
  });
  revalidatePath("/focus");
  revalidatePath("/loot");
  revalidatePath("/tasks");
}

// ---------------------------------------------------------------------------
// Board widgets
// ---------------------------------------------------------------------------

const WIDGET_TYPES = ["note", "whiteboard", "timer", "habit", "quick-tasks"] as const;

const WidgetTypeSchema = z.enum(WIDGET_TYPES);

const WIDGET_DEFAULTS: Record<
  (typeof WIDGET_TYPES)[number],
  { title: string; color: string; width: number; height: number; content: string }
> = {
  note: {
    title: "Note",
    color: "#fef9c3",
    width: 280,
    height: 240,
    content: JSON.stringify({ text: "" }),
  },
  whiteboard: {
    title: "Whiteboard",
    color: "#ffffff",
    width: 480,
    height: 360,
    content: JSON.stringify({ strokes: [] }),
  },
  timer: {
    title: "Timer",
    color: "#dbeafe",
    width: 260,
    height: 200,
    content: JSON.stringify({ seconds: 1500, running: false, lastStartedAt: null }),
  },
  habit: {
    title: "Daily habit",
    color: "#dcfce7",
    width: 280,
    height: 240,
    content: JSON.stringify({ days: [false, false, false, false, false, false, false], label: "Ship code" }),
  },
  "quick-tasks": {
    title: "Quick tasks",
    color: "#f3e8ff",
    width: 280,
    height: 300,
    content: JSON.stringify({ items: [] }),
  },
};

export async function createWidget(type: string, x: number, y: number) {
  const user = await requireUser();
  const parsedType = WidgetTypeSchema.parse(type);
  const defaults = WIDGET_DEFAULTS[parsedType];

  const maxZ = await prisma.widget.aggregate({
    where: { userId: user.id },
    _max: { zIndex: true },
  });

  const widget = await prisma.widget.create({
    data: {
      userId: user.id,
      type: parsedType,
      x: Math.round(x),
      y: Math.round(y),
      width: defaults.width,
      height: defaults.height,
      zIndex: (maxZ._max.zIndex ?? 0) + 1,
      color: defaults.color,
      title: defaults.title,
      content: defaults.content,
    },
  });
  revalidatePath("/board");
  return widget;
}

export async function updateWidgetPosition(
  id: string,
  data: { x?: number; y?: number; width?: number; height?: number; zIndex?: number },
) {
  const user = await requireUser();
  const payload: Record<string, number> = {};
  if (data.x !== undefined) payload.x = Math.round(data.x);
  if (data.y !== undefined) payload.y = Math.round(data.y);
  if (data.width !== undefined) payload.width = Math.round(data.width);
  if (data.height !== undefined) payload.height = Math.round(data.height);
  if (data.zIndex !== undefined) payload.zIndex = Math.round(data.zIndex);
  await prisma.widget.updateMany({
    where: { id, userId: user.id },
    data: payload,
  });
}

export async function updateWidgetContent(
  id: string,
  updates: { title?: string; color?: string; content?: string },
) {
  const user = await requireUser();
  const payload: Record<string, string> = {};
  if (updates.title !== undefined) payload.title = updates.title.slice(0, 200);
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.content !== undefined) {
    // Defense: cap content at 500KB
    if (updates.content.length > 500_000) {
      throw new Error("Widget content too large");
    }
    payload.content = updates.content;
  }
  await prisma.widget.updateMany({
    where: { id, userId: user.id },
    data: payload,
  });
}

export async function deleteWidget(id: string) {
  const user = await requireUser();
  await prisma.widget.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/board");
}
