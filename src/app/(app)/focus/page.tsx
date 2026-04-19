import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FocusView } from "./focus-view";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [openTasks, recentEntries, todayEntries] = await Promise.all([
    prisma.task.findMany({
      where: { userId: session.user.id, completed: false },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        billingType: true,
        rateCents: true,
        priceCents: true,
      },
    }),
    prisma.timeEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { task: { select: { id: true, title: true } } },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startedAt: { gte: startOfToday() },
      },
      select: { kind: true, seconds: true },
    }),
  ]);

  const activeEntry = recentEntries.find((e) => e.endedAt === null) ?? null;

  const todayFocusSeconds = todayEntries
    .filter((e) => e.kind === "focus")
    .reduce((a, e) => a + e.seconds, 0);
  const todayBillableSeconds = todayEntries
    .filter((e) => e.kind === "billable")
    .reduce((a, e) => a + e.seconds, 0);

  return (
    <FocusView
      tasks={openTasks}
      recent={recentEntries.map((e) => ({
        id: e.id,
        kind: e.kind,
        startedAt: e.startedAt,
        endedAt: e.endedAt,
        seconds: e.seconds,
        task: e.task,
      }))}
      activeEntry={activeEntry ? { id: activeEntry.id, kind: activeEntry.kind, startedAt: activeEntry.startedAt, taskId: activeEntry.taskId } : null}
      todayFocusSeconds={todayFocusSeconds}
      todayBillableSeconds={todayBillableSeconds}
    />
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
