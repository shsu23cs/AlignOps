import { PrismaClient, CyclePhase, GoalSheetStatus } from "@prisma/client";
import { CompletionReportQuery, AchievementReportQuery } from "./schema";
import { Writable } from "stream";

export async function completionReport(
  prisma: PrismaClient,
  filters: CompletionReportQuery,
  requesterId: string,
  requesterRole: string
) {
  const { cycleId, department, page, limit } = filters;
  const skip = (page - 1) * limit;

  // Build user filter
  const userWhere: any = {};
  if (department) userWhere.department = department;
  if (requesterRole === "MANAGER") userWhere.managerId = requesterId;

  const users = await prisma.user.findMany({
    where: { ...userWhere, role: "EMPLOYEE" },
    select: { id: true, name: true, email: true, department: true },
    skip,
    take: limit,
    orderBy: { name: "asc" },
  });

  const total = await prisma.user.count({
    where: { ...userWhere, role: "EMPLOYEE" },
  });

  const phases: CyclePhase[] = ["GOAL_SETTING", "Q1", "Q2", "Q3", "Q4"];

  const rows = await Promise.all(
    users.map(async (user) => {
      const sheetWhere: any = { employeeId: user.id };
      if (cycleId) sheetWhere.cycleId = cycleId;

      const sheets = await prisma.goalSheet.findMany({
        where: sheetWhere,
        select: { status: true, cycle: { select: { phase: true } } },
      });

      const phaseStats: Record<string, string> = {};
      for (const phase of phases) {
        const sheet = sheets.find((s) => s.cycle.phase === phase);
        phaseStats[phase] = sheet?.status ?? "NOT_STARTED";
      }

      const submitted = sheets.filter(
        (s) =>
          s.status === GoalSheetStatus.PENDING_APPROVAL ||
          s.status === GoalSheetStatus.APPROVED
      ).length;

      return {
        employee: user,
        submittedCount: submitted,
        totalCycles: sheets.length,
        phases: phaseStats,
      };
    })
  );

  return { data: rows, total, page, limit };
}

export async function achievementReport(
  prisma: PrismaClient,
  filters: AchievementReportQuery,
  requesterId: string,
  requesterRole: string
) {
  const { employeeId, department, phase, thrustArea, cycleId, page, limit } = filters;
  const skip = (page - 1) * limit;

  // Build the query
  const goalWhere: any = {};
  if (thrustArea) goalWhere.thrustArea = { contains: thrustArea, mode: "insensitive" };
  if (phase) {
    goalWhere.achievements = { some: { cyclePhase: phase } };
  }

  const sheetWhere: any = {};
  if (cycleId) sheetWhere.cycleId = cycleId;
  if (employeeId) {
    sheetWhere.employeeId = employeeId;
  } else if (requesterRole === "MANAGER") {
    // Only direct reports
    const reports = await prisma.user.findMany({
      where: { managerId: requesterId },
      select: { id: true },
    });
    sheetWhere.employeeId = { in: reports.map((r) => r.id) };
  }
  if (department) {
    sheetWhere.employee = { department };
  }

  const goals = await prisma.goal.findMany({
    where: { ...goalWhere, goalSheet: sheetWhere },
    include: {
      goalSheet: {
        include: {
          employee: { select: { id: true, name: true, department: true } },
          cycle: { select: { year: true, phase: true } },
        },
      },
      achievements: phase ? { where: { cyclePhase: phase as CyclePhase } } : true,
    },
    skip,
    take: limit,
    orderBy: [{ goalSheet: { employee: { name: "asc" } } }, { createdAt: "asc" }],
  });

  const total = await prisma.goal.count({
    where: { ...goalWhere, goalSheet: sheetWhere },
  });

  const rows = goals.map((goal) => ({
    employee: goal.goalSheet.employee,
    cycle: goal.goalSheet.cycle,
    goal: {
      id: goal.id,
      thrustArea: goal.thrustArea,
      title: goal.title,
      uomType: goal.uomType,
      target: goal.target,
      weightage: goal.weightage,
      isShared: goal.isShared,
    },
    achievements: goal.achievements.map((a) => ({
      phase: a.cyclePhase,
      actualValue: a.actualValue,
      status: a.status,
      score: a.score,
      scorePercent: a.score !== null ? Math.round(Number(a.score) * 100) : null,
    })),
  }));

  return { data: rows, total, page, limit };
}

export async function exportAchievementCsv(
  prisma: PrismaClient,
  filters: AchievementReportQuery
): Promise<string> {
  const { data } = await achievementReport(
    prisma,
    { ...filters, limit: 500, page: 1 },
    "",
    "ADMIN"
  );

  const header = [
    "Employee Name",
    "Department",
    "Cycle Year",
    "Cycle Phase",
    "Thrust Area",
    "Goal Title",
    "UoM Type",
    "Target",
    "Weightage (%)",
    "Is Shared",
    "Q1 Actual",
    "Q1 Score (%)",
    "Q2 Actual",
    "Q2 Score (%)",
    "Q3 Actual",
    "Q3 Score (%)",
    "Q4 Actual",
    "Q4 Score (%)",
  ].join(",");

  const lines = data.map((row) => {
    const getPhase = (phase: string) =>
      row.achievements.find((a) => a.phase === phase);

    const q1 = getPhase("Q1");
    const q2 = getPhase("Q2");
    const q3 = getPhase("Q3");
    const q4 = getPhase("Q4");

    return [
      `"${row.employee.name}"`,
      `"${row.employee.department}"`,
      row.cycle.year,
      row.cycle.phase,
      `"${row.goal.thrustArea}"`,
      `"${row.goal.title}"`,
      row.goal.uomType,
      row.goal.target ?? "",
      row.goal.weightage,
      row.goal.isShared,
      q1?.actualValue ?? "",
      q1?.scorePercent ?? "",
      q2?.actualValue ?? "",
      q2?.scorePercent ?? "",
      q3?.actualValue ?? "",
      q3?.scorePercent ?? "",
      q4?.actualValue ?? "",
      q4?.scorePercent ?? "",
    ].join(",");
  });

  return [header, ...lines].join("\n");
}
