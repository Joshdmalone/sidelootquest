import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectsView } from "./projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        client: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ProjectsView projects={projects} clients={clients} />;
}
