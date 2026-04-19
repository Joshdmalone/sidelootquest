/**
 * Dev seed — creates a demo user + sample tasks, projects, clients.
 * Run with: npm run db:seed
 *
 * This won't conflict with real GitHub OAuth signups (different email).
 */
import "dotenv/config";
import { PrismaClient, Priority, BillingType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "demo@sidelootquest.local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo Hustler",
      taxRatePct: 28,
      weeklyGoalCents: 50000, // $500/week
    },
  });

  // Clean any prior demo data
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  const acme = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Acme Corp",
      email: "sarah@acme.test",
    },
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
    data: {
      userId: user.id,
      name: "1:1 coaching",
      color: "#10b981",
    },
  });

  const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: "Ship landing page v2",
        projectId: websiteProject.id,
        clientId: acme.id,
        dueAt: inAnHour,
        priority: Priority.HIGH,
        billingType: BillingType.FIXED,
        priceCents: 120000,
      },
      {
        userId: user.id,
        title: "Coaching session — Jordan",
        projectId: coachingProject.id,
        dueAt: tomorrow,
        priority: Priority.MEDIUM,
        billingType: BillingType.HOURLY,
        rateCents: 15000,
      },
      {
        userId: user.id,
        title: "Client onboarding call — Orbit",
        clientId: orbit.id,
        dueAt: tomorrow,
        billingType: BillingType.HOURLY,
        rateCents: 10000,
      },
      {
        userId: user.id,
        title: "Invoice Acme for November",
        clientId: acme.id,
        dueAt: yesterday,
        priority: Priority.HIGH,
      },
      {
        userId: user.id,
        title: "Write blog post about freelance rates",
        priority: Priority.LOW,
      },
      // A completed one so Loot dashboard has data
      {
        userId: user.id,
        title: "Logo redesign — Orbit",
        clientId: orbit.id,
        completed: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        billingType: BillingType.FIXED,
        priceCents: 80000,
      },
    ],
  });

  console.log(`Seeded demo user: ${email} (id ${user.id})`);
  console.log("⚠  Note: demo user has no OAuth account — use it for local inspection only.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
