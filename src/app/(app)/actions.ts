"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTaskInput } from "@/lib/nlp-date";

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  billingType: z.enum(["NONE", "HOURLY", "FIXED"]).default("NONE"),
  rateDollars: z.coerce.number().nonnegative().optional(),
  priceDollars: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateTaskSchema.parse({
    ...raw,
    projectId: raw.projectId || null,
    clientId: raw.clientId || null,
    notes: raw.notes || null,
  });

  // NLP date extraction from the title
  const { title, dueAt } = parseTaskInput(parsed.title);

  await prisma.task.create({
    data: {
      userId: user.id,
      title,
      notes: parsed.notes,
      dueAt,
      priority: parsed.priority,
      projectId: parsed.projectId || null,
      clientId: parsed.clientId || null,
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

export async function updateTaskPriority(taskId: string, priority: "NONE" | "LOW" | "MEDIUM" | "HIGH") {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: { priority },
  });
  revalidatePath("/tasks");
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

// ---------------------------------------------------------------------------
// Time entries
// ---------------------------------------------------------------------------

export async function startTimer(kind: "focus" | "billable", taskId?: string) {
  const user = await requireUser();
  // Close any open timers first
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
