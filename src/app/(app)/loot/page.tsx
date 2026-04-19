import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LootView } from "./loot-view";

export const dynamic = "force-dynamic";

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - diff);
  return date;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

export default async function LootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const [user, completedTasks, timeEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { taxRatePct: true, weeklyGoalCents: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        completed: true,
        completedAt: { not: null },
        billingType: { in: ["HOURLY", "FIXED"] },
      },
      include: {
        client: { select: { id: true, name: true } },
        timeEntries: { select: { seconds: true, startedAt: true } },
      },
    }),
    prisma.timeEntry.findMany({
      where: { userId, kind: "billable", endedAt: { not: null } },
      select: { seconds: true, startedAt: true, taskId: true },
    }),
  ]);

  const taxRatePct = user?.taxRatePct ?? 25;
  const weeklyGoalCents = user?.weeklyGoalCents ?? 0;

  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const yearStart = startOfYear();

  // Compute revenue per task and bucket into WTD/MTD/YTD
  let wtdCents = 0;
  let mtdCents = 0;
  let ytdCents = 0;
  let allTimeCents = 0;
  const perClient = new Map<string, { name: string; cents: number; tasks: number }>();

  for (const t of completedTasks) {
    let cents = 0;
    if (t.billingType === "FIXED" && t.priceCents) {
      cents = t.priceCents;
    } else if (t.billingType === "HOURLY" && t.rateCents) {
      const s = t.timeEntries.reduce((a, e) => a + e.seconds, 0);
      cents = Math.round((t.rateCents * s) / 3600);
    }
    if (cents <= 0) continue;

    const when = t.completedAt ?? new Date();
    allTimeCents += cents;
    if (when >= yearStart) ytdCents += cents;
    if (when >= monthStart) mtdCents += cents;
    if (when >= weekStart) wtdCents += cents;

    if (t.client) {
      const prev = perClient.get(t.client.id) ?? { name: t.client.name, cents: 0, tasks: 0 };
      prev.cents += cents;
      prev.tasks += 1;
      perClient.set(t.client.id, prev);
    }
  }

  const totalBillableSecondsYTD = timeEntries
    .filter((e) => e.startedAt >= yearStart)
    .reduce((a, e) => a + e.seconds, 0);

  const taxJarCents = Math.round((allTimeCents * taxRatePct) / 100);
  const effectiveRate =
    totalBillableSecondsYTD > 0 ? (ytdCents / (totalBillableSecondsYTD / 3600)) | 0 : 0;

  const weekProgress = weeklyGoalCents > 0 ? Math.min(1, wtdCents / weeklyGoalCents) : 0;

  const clientRows = [...perClient.values()].sort((a, b) => b.cents - a.cents);

  return (
    <LootView
      wtdCents={wtdCents}
      mtdCents={mtdCents}
      ytdCents={ytdCents}
      allTimeCents={allTimeCents}
      taxJarCents={taxJarCents}
      taxRatePct={taxRatePct}
      weeklyGoalCents={weeklyGoalCents}
      weekProgress={weekProgress}
      effectiveHourlyCents={effectiveRate}
      billableHoursYTD={totalBillableSecondsYTD / 3600}
      clientRows={clientRows}
    />
  );
}
