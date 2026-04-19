/**
 * Dev seed — creates a demo user + sample tasks, projects, clients, Kanban
 * columns, and some starter board widgets.
 *
 * Run with: npm run db:seed
 *
 * The demo user's email matches the Dev Sign-in credentials provider (auth.ts),
 * so after seeding you can click "Dev sign in" and land in the app instantly.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (try file:./dev.db)");
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const DEV_EMAIL = "dev@sidelootquest.local";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    update: {},
    create: {
      email: DEV_EMAIL,
      name: "Dev Hustler",
      taxRatePct: 28,
      weeklyGoalCents: 50000,
    },
  });

  // Wipe prior demo data
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.taskColumn.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });
  await prisma.widget.deleteMany({ where: { userId: user.id } });

  // ── Kanban columns
  const todoCol = await prisma.taskColumn.create({
    data: { userId: user.id, name: "To Do", color: "#64748b", sortOrder: 0 },
  });
  const doingCol = await prisma.taskColumn.create({
    data: { userId: user.id, name: "Doing", color: "#8b5cf6", sortOrder: 1 },
  });
  const doneCol = await prisma.taskColumn.create({
    data: { userId: user.id, name: "Done", color: "#10b981", sortOrder: 2 },
  });

  // ── Clients + projects
  const acme = await prisma.client.create({
    data: { userId: user.id, name: "Acme Corp", email: "sarah@acme.test" },
  });
  const orbit = await prisma.client.create({
    data: { userId: user.id, name: "Orbit Labs" },
  });
  const websiteProject = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Acme website rebuild",
      color: "#3b82f6",
      clientId: acme.id,
    },
  });
  const coachingProject = await prisma.project.create({
    data: { userId: user.id, name: "1:1 coaching", color: "#10b981" },
  });

  const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ── Tasks (distributed across columns)
  await prisma.task.create({
    data: {
      userId: user.id,
      columnId: doingCol.id,
      title: "Ship landing page v2",
      projectId: websiteProject.id,
      clientId: acme.id,
      dueAt: inAnHour,
      priority: "HIGH",
      billingType: "FIXED",
      priceCents: 120000,
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      columnId: todoCol.id,
      title: "Coaching session — Jordan",
      projectId: coachingProject.id,
      dueAt: tomorrow,
      priority: "MEDIUM",
      billingType: "HOURLY",
      rateCents: 15000,
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      columnId: todoCol.id,
      title: "Client onboarding call — Orbit",
      clientId: orbit.id,
      dueAt: tomorrow,
      billingType: "HOURLY",
      rateCents: 10000,
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      columnId: doingCol.id,
      title: "Invoice Acme for November",
      clientId: acme.id,
      dueAt: yesterday,
      priority: "HIGH",
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      columnId: todoCol.id,
      title: "Write blog post about freelance rates",
      priority: "LOW",
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      columnId: doneCol.id,
      title: "Logo redesign — Orbit",
      clientId: orbit.id,
      completed: true,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      billingType: "FIXED",
      priceCents: 80000,
    },
  });

  // ── Board widgets (sample dashboard)
  await prisma.widget.create({
    data: {
      userId: user.id,
      type: "note",
      x: 3950,
      y: 3850,
      width: 280,
      height: 220,
      zIndex: 1,
      color: "#fef9c3",
      title: "Quick notes",
      content: JSON.stringify({
        text: "Welcome to the Board.\n\nDrop widgets from the left panel.\nDrag to move. Scroll to pan.\nCtrl+Scroll to zoom.",
      }),
    },
  });
  await prisma.widget.create({
    data: {
      userId: user.id,
      type: "timer",
      x: 4270,
      y: 3850,
      width: 240,
      height: 220,
      zIndex: 2,
      color: "#dbeafe",
      title: "Pomodoro",
      content: JSON.stringify({ seconds: 25 * 60, running: false, lastStartedAt: null }),
    },
  });
  await prisma.widget.create({
    data: {
      userId: user.id,
      type: "habit",
      x: 4550,
      y: 3850,
      width: 280,
      height: 240,
      zIndex: 3,
      color: "#dcfce7",
      title: "Daily habit",
      content: JSON.stringify({
        days: [true, true, false, true, false, false, false],
        label: "Ship one thing",
      }),
    },
  });
  await prisma.widget.create({
    data: {
      userId: user.id,
      type: "whiteboard",
      x: 3950,
      y: 4120,
      width: 480,
      height: 340,
      zIndex: 4,
      color: "#ffffff",
      title: "Whiteboard",
      content: JSON.stringify({ strokes: [] }),
    },
  });
  await prisma.widget.create({
    data: {
      userId: user.id,
      type: "quick-tasks",
      x: 4470,
      y: 4120,
      width: 280,
      height: 280,
      zIndex: 5,
      color: "#f3e8ff",
      title: "Side quests",
      content: JSON.stringify({
        items: [
          { text: "Sign up for an LLC", done: false },
          { text: "Open business bank account", done: false },
          { text: "First 10 customers list", done: true },
        ],
      }),
    },
  });

  console.log(`✓ Seeded ${DEV_EMAIL}`);
  console.log(`✓ 3 Kanban columns, 6 tasks, 2 clients, 2 projects, 5 board widgets`);
  console.log(`→ Click "Dev sign in" to see it all.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
