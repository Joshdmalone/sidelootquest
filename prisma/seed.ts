/**
 * Dev seed — creates a demo user + sample tasks, projects, clients.
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
      weeklyGoalCents: 50000, // $500/week
    },
  });

  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

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

  // Note: SQLite createMany is supported but Prisma 7 libsql adapter may route
  // through separate statements — fine for seed.
  await prisma.task.create({
    data: {
      userId: user.id,
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
      title: "Invoice Acme for November",
      clientId: acme.id,
      dueAt: yesterday,
      priority: "HIGH",
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      title: "Write blog post about freelance rates",
      priority: "LOW",
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      title: "Logo redesign — Orbit",
      clientId: orbit.id,
      completed: true,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      billingType: "FIXED",
      priceCents: 80000,
    },
  });

  console.log(`✓ Seeded ${DEV_EMAIL} (id: ${user.id})`);
  console.log(`✓ Created 2 clients, 2 projects, 6 tasks (1 already completed)`);
  console.log(`→ Start the dev server and click "Dev sign in" to see it all.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
