import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KanbanBoard, type KanbanTask, type KanbanColumn } from "./kanban";
import { ensureDefaultColumns } from "../actions";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  await ensureDefaultColumns(session.user.id);

  const [columns, tasks, projects, clients] = await Promise.all([
    prisma.taskColumn.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.task.findMany({
      where: { userId: session.user.id },
      include: {
        project: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, name: true } },
        timeEntries: { select: { seconds: true } },
      },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { userId: session.user.id, archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Shape tasks for the client
  const kanbanTasks: KanbanTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    priority: (t.priority as KanbanTask["priority"]) || "NONE",
    billingType: (t.billingType as KanbanTask["billingType"]) || "NONE",
    rateCents: t.rateCents,
    priceCents: t.priceCents,
    columnId: t.columnId,
    loggedSeconds: t.timeEntries.reduce((a, e) => a + e.seconds, 0),
    project: t.project,
    client: t.client,
  }));

  const kanbanColumns: KanbanColumn[] = columns.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    sortOrder: c.sortOrder,
  }));

  return (
    <KanbanBoard
      columns={kanbanColumns}
      tasks={kanbanTasks}
      projects={projects}
      clients={clients}
    />
  );
}
