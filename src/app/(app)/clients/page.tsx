import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientsView } from "./clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    include: {
      tasks: {
        select: {
          completed: true,
          billingType: true,
          priceCents: true,
          rateCents: true,
          timeEntries: { select: { seconds: true } },
        },
      },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute per-client revenue
  const rows = clients.map((c) => {
    let earnedCents = 0;
    for (const t of c.tasks) {
      if (!t.completed) continue;
      if (t.billingType === "FIXED" && t.priceCents) earnedCents += t.priceCents;
      if (t.billingType === "HOURLY" && t.rateCents) {
        const s = t.timeEntries.reduce((a, e) => a + e.seconds, 0);
        earnedCents += Math.round((t.rateCents * s) / 3600);
      }
    }
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      notes: c.notes,
      taskCount: c.tasks.length,
      projectCount: c._count.projects,
      earnedCents,
    };
  });

  return <ClientsView clients={rows} />;
}
