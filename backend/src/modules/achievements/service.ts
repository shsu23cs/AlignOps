import { PrismaClient, CyclePhase, AuditEntityType, AuditAction } from "@prisma/client";
import { assertWindowOpen } from "../../lib/cycle-guard";
import { computeScore } from "../../lib/score-engine";
import { notFound, forbidden, unprocessable } from "../../lib/errors";
import { UpsertAchievementBody } from "./schema";

export async function listAchievements(
  prisma: PrismaClient,
  goalId: string,
  requesterId: string,
  requesterRole: string
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });
  if (!goal) throw notFound("Goal");

  // Access control
  if (requesterRole === "EMPLOYEE" && goal.goalSheet.employeeId !== requesterId) {
    throw forbidden();
  }
  if (requesterRole === "MANAGER") {
    const isReport = await prisma.user.findFirst({
      where: { id: goal.goalSheet.employeeId, managerId: requesterId },
    });
    if (!isReport) throw forbidden("You can only view your direct reports' achievements.");
  }

  return prisma.achievement.findMany({
    where: { goalId },
    orderBy: { cyclePhase: "asc" },
  });
}

export async function upsertAchievement(
  prisma: PrismaClient,
  goalId: string,
  phase: CyclePhase,
  data: UpsertAchievementBody,
  employeeId: string
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      goalSheet: true,
      sharedCopies: { include: { goalSheet: true } },
    },
  });
  if (!goal) throw notFound("Goal");

  // Only the goal's owner can update achievements
  if (goal.goalSheet.employeeId !== employeeId) throw forbidden();

  // Sheet must be locked (approved)
  if (!goal.goalSheet.locked) {
    throw unprocessable("Achievement updates are only allowed after the goal sheet is approved.", [
      { field: "goal_sheet", message: "Goal sheet must be approved (locked) first." },
    ]);
  }

  // Window check — phase must be active
  await assertWindowOpen(prisma, phase);

  // Compute score
  const score = computeScore({
    uomType: goal.uomType,
    target: goal.target !== null ? Number(goal.target) : null,
    targetDate: goal.targetDate,
    actualValue: data.actualValue ?? null,
    actualDate: data.actualDate ?? null,
  });

  // Upsert + sync shared copies in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const achievement = await tx.achievement.upsert({
      where: { goalId_cyclePhase: { goalId, cyclePhase: phase } },
      create: {
        goalId,
        cyclePhase: phase,
        actualValue: data.actualValue ?? null,
        actualDate: data.actualDate ?? null,
        status: data.status,
        score: score !== null ? score : null,
      },
      update: {
        actualValue: data.actualValue ?? null,
        actualDate: data.actualDate ?? null,
        status: data.status,
        score: score !== null ? score : null,
      },
    });

    // Sync shared copies (same transaction)
    if (goal.sharedCopies && goal.sharedCopies.length > 0) {
      for (const copy of goal.sharedCopies) {
        const copyScore = computeScore({
          uomType: copy.uomType,
          target: copy.target !== null ? Number(copy.target) : null,
          targetDate: copy.targetDate,
          actualValue: data.actualValue ?? null,
          actualDate: data.actualDate ?? null,
        });

        await tx.achievement.upsert({
          where: { goalId_cyclePhase: { goalId: copy.id, cyclePhase: phase } },
          create: {
            goalId: copy.id,
            cyclePhase: phase,
            actualValue: data.actualValue ?? null,
            actualDate: data.actualDate ?? null,
            status: data.status,
            score: copyScore !== null ? copyScore : null,
          },
          update: {
            actualValue: data.actualValue ?? null,
            actualDate: data.actualDate ?? null,
            status: data.status,
            score: copyScore !== null ? copyScore : null,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: AuditEntityType.ACHIEVEMENT,
            entityId: copy.id,
            actorId: employeeId,
            action: AuditAction.EDIT,
            fieldName: "actualValue",
            oldValue: "synced",
            newValue: String(data.actualValue),
            achievementId: achievement.id,
          },
        });
      }
    }

    return achievement;
  });

  return result;
}
