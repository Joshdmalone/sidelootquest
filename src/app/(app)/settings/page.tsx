import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { taxRatePct: true, weeklyGoalCents: true, timezone: true, email: true, name: true },
  });

  return (
    <SettingsView
      initial={{
        taxRatePct: user?.taxRatePct ?? 25,
        weeklyGoalDollars: (user?.weeklyGoalCents ?? 0) / 100,
        timezone: user?.timezone ?? "America/New_York",
        email: user?.email ?? "",
        name: user?.name ?? "",
      }}
    />
  );
}
