/**
 * Prisma Seed — AlignOps Demo Data
 * Creates 1 Admin, 2 Managers, 4 Employees for hackathon demo
 * Run: npm run db:seed
 */

import { PrismaClient, Role, CyclePhase } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Seeding AlignOps database...");

  // ── Clean slate (order matters: children first, parents last) ────────────
  await prisma.auditLog.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ─────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@alignops.com",
      passwordHash: await hash("Admin@123"),
      role: Role.ADMIN,
      department: "HR",
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Managers ─────────────────────────────────────────────────────────────
  const manager1 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "manager1@alignops.com",
      passwordHash: await hash("Manager@123"),
      role: Role.MANAGER,
      department: "Engineering",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Rohan Mehta",
      email: "manager2@alignops.com",
      passwordHash: await hash("Manager@123"),
      role: Role.MANAGER,
      department: "Sales",
    },
  });
  console.log(`✅ Managers: ${manager1.email}, ${manager2.email}`);

  // ── Employees ─────────────────────────────────────────────────────────────
  const emp1 = await prisma.user.create({
    data: {
      name: "Arjun Kapoor",
      email: "emp1@alignops.com",
      passwordHash: await hash("Employee@123"),
      role: Role.EMPLOYEE,
      department: "Engineering",
      managerId: manager1.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      name: "Sneha Reddy",
      email: "emp2@alignops.com",
      passwordHash: await hash("Employee@123"),
      role: Role.EMPLOYEE,
      department: "Engineering",
      managerId: manager1.id,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      name: "Vikram Singh",
      email: "emp3@alignops.com",
      passwordHash: await hash("Employee@123"),
      role: Role.EMPLOYEE,
      department: "Sales",
      managerId: manager2.id,
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      name: "Anjali Nair",
      email: "emp4@alignops.com",
      passwordHash: await hash("Employee@123"),
      role: Role.EMPLOYEE,
      department: "Sales",
      managerId: manager2.id,
    },
  });
  console.log(`✅ Employees: ${emp1.email}, ${emp2.email}, ${emp3.email}, ${emp4.email}`);

  // ── Cycles ────────────────────────────────────────────────────────────────
  // Make GOAL_SETTING window cover the entire current year so the demo works
  // any time it's seeded. In production these would be real date ranges.
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);       // Jan 1
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31

  const goalSettingCycle = await prisma.cycle.create({
    data: {
      year: now.getFullYear(),
      phase: CyclePhase.GOAL_SETTING,
      windowOpen: yearStart,
      windowClose: yearEnd,
      isActive: true,
      createdById: admin.id,
    },
  });

  // Q1–Q4 windows — also cover full year for demo flexibility
  await prisma.cycle.create({
    data: {
      year: now.getFullYear(),
      phase: CyclePhase.Q1,
      windowOpen: yearStart,
      windowClose: yearEnd,
      isActive: true,
      createdById: admin.id,
    },
  });

  await prisma.cycle.create({
    data: {
      year: now.getFullYear(),
      phase: CyclePhase.Q2,
      windowOpen: yearStart,
      windowClose: yearEnd,
      isActive: true,
      createdById: admin.id,
    },
  });

  await prisma.cycle.createMany({
    data: [
      {
        year: now.getFullYear(),
        phase: CyclePhase.Q3,
        windowOpen: yearStart,
        windowClose: yearEnd,
        isActive: true,
        createdById: admin.id,
      },
      {
        year: now.getFullYear(),
        phase: CyclePhase.Q4,
        windowOpen: yearStart,
        windowClose: yearEnd,
        isActive: true,
        createdById: admin.id,
      },
    ],
  });
  console.log(`✅ Cycles created for ${now.getFullYear()} (all windows open for demo)`);

  // ── Demo Goal Sheets (for emp1 & emp2) ────────────────────────────────────
  const sheet1 = await prisma.goalSheet.create({
    data: {
      employeeId: emp1.id,
      cycleId: goalSettingCycle.id,
      status: "DRAFT",
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        goalSheetId: sheet1.id,
        thrustArea: "Product Quality",
        title: "Reduce critical bug backlog by 50%",
        description: "Identify, prioritize, and resolve all P0/P1 bugs in Q1.",
        uomType: "NUMERIC_MIN",
        target: 50,
        weightage: 30,
        status: "NOT_STARTED",
      },
      {
        goalSheetId: sheet1.id,
        thrustArea: "Team Development",
        title: "Complete 3 technical training modules",
        description: "Upskill on cloud architecture and microservices.",
        uomType: "NUMERIC_MIN",
        target: 3,
        weightage: 25,
        status: "NOT_STARTED",
      },
      {
        goalSheetId: sheet1.id,
        thrustArea: "Delivery",
        title: "Ship v2.0 feature release on time",
        description: "Deliver all committed features by target date.",
        uomType: "TIMELINE",
        targetDate: new Date(`${now.getFullYear()}-06-30`),
        weightage: 45,
        status: "NOT_STARTED",
      },
    ],
  });

  const sheet2 = await prisma.goalSheet.create({
    data: {
      employeeId: emp2.id,
      cycleId: goalSettingCycle.id,
      status: "DRAFT",
    },
  });

  await prisma.goal.create({
    data: {
      goalSheetId: sheet2.id,
      thrustArea: "Customer Satisfaction",
      title: "Maintain NPS score above 70",
      description: "Gather feedback and implement improvements to maintain NPS.",
      uomType: "NUMERIC_MIN",
      target: 70,
      weightage: 40,
      status: "NOT_STARTED",
    },
  });

  console.log(`✅ Demo goal sheets created for ${emp1.name} and ${emp2.name}`);

  console.log("\n🎉 Seed complete!\n");
  console.log("─── Demo Credentials ───────────────────────────────────────────");
  console.log("Admin:     admin@alignops.com      / Admin@123");
  console.log("Manager 1: manager1@alignops.com   / Manager@123  (Engineering)");
  console.log("Manager 2: manager2@alignops.com   / Manager@123  (Sales)");
  console.log("Employee 1: emp1@alignops.com      / Employee@123 (under Manager 1)");
  console.log("Employee 2: emp2@alignops.com      / Employee@123 (under Manager 1)");
  console.log("Employee 3: emp3@alignops.com      / Employee@123 (under Manager 2)");
  console.log("Employee 4: emp4@alignops.com      / Employee@123 (under Manager 2)");
  console.log("────────────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
