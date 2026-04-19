import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TasksView } from "./tasks-view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [tasks, projects, clients] = await Promise.all([
    prisma.task.findMany({
      where: { userId: session.user.id },
      include: {
        project: true,
        client: true,
        timeEntries: { select: { seconds: true } },
      },
      orderBy: [{ completed: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { userId: session.user.id, archived: false },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return <TasksView tasks={tasks} projects={projects} clients={clients} />;
}
