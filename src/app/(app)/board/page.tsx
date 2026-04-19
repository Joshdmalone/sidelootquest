import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BoardCanvas, type WidgetRecord } from "./board-canvas";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const widgets = await prisma.widget.findMany({
    where: { userId: session.user.id },
    orderBy: { zIndex: "asc" },
  });

  const records: WidgetRecord[] = widgets.map((w) => ({
    id: w.id,
    type: w.type,
    x: w.x,
    y: w.y,
    width: w.width,
    height: w.height,
    zIndex: w.zIndex,
    color: w.color,
    title: w.title,
    content: w.content,
  }));

  return <BoardCanvas initialWidgets={records} />;
}
