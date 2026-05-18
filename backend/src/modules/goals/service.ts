import {
  PrismaClient,
  GoalSheetStatus,
  CyclePhase,
  AuditAction,
  AuditEntityType,
} from "@prisma/client";
import { assertWindowOpen } from "../../lib/cycle-guard";
import { notFound, forbidden, conflict, unprocessable } from "../../lib/errors";
import { GoalBody, UpdateGoalBody, ShareGoalBody } from "./schema";

export async function listGoals(
  prisma: PrismaClient,
  sheetId: string,
  requesterId: string,
  requesterRole: string
) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { employee: true },
  });
  if (!sheet) throw notFound("GoalSheet");

  if (requesterRole === "EMPLOYEE" && sheet.employeeId !== requesterId) {
    throw forbidden();
  }
  if (requesterRole === "MANAGER") {
    const isReport = await prisma.user.findFirst({
      where: { id: sheet.employeeId, managerId: requesterId },
    });
    if (!isReport) throw forbidden("You can only view your direct reports' goals.");
  }

  return prisma.goal.findMany({
    where: { goalSheetId: sheetId },
    include: { achievements: true, sharedCopies: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addGoal(
  prisma: PrismaClient,
  sheetId: string,
  employeeId: string,
  data: GoalBody
) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true },
  });
  if (!sheet) throw notFound("GoalSheet");
  if (sheet.employeeId !== employeeId) throw forbidden();
  if (sheet.status !== GoalSheetStatus.DRAFT && sheet.status !== GoalSheetStatus.RETURNED) {
    throw conflict("Goals can only be added while the sheet is in DRAFT or RETURNED status.");
  }

  // Window check
  await assertWindowOpen(prisma, CyclePhase.GOAL_SETTING);

  // Max 8 goals
  if (sheet.goals.length >= 8) {
    throw unprocessable("Goal sheet already has the maximum of 8 goals.", [
      { field: "goal_count", message: "Maximum 8 goals per sheet." },
    ]);
  }

  return prisma.goal.create({
    data: {
      goalSheetId: sheetId,
      thrustArea: data.thrustArea,
      title: data.title,
      description: data.description,
      uomType: data.uomType,
      target: data.target !== undefined ? data.target : null,
      targetDate: data.targetDate !== undefined ? data.targetDate : null,
      weightage: data.weightage,
      status: data.status,
    },
    include: { achievements: true },
  });
}

export async function updateGoal(
  prisma: PrismaClient,
  goalId: string,
  data: UpdateGoalBody,
  actorId: string,
  actorRole: string
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });
  if (!goal) throw notFound("Goal");

  const sheet = goal.goalSheet;

  // Access control
  if (actorRole === "EMPLOYEE") {
    if (sheet.employeeId !== actorId) throw forbidden();
    if (sheet.status !== GoalSheetStatus.DRAFT && sheet.status !== GoalSheetStatus.RETURNED) {
      throw conflict("Goals can only be edited while the sheet is in DRAFT or RETURNED status.");
    }
  }
  if (actorRole === "MANAGER") {
    if (sheet.status !== GoalSheetStatus.PENDING_APPROVAL) {
      throw conflict("Managers can only edit goals while the sheet is awaiting approval.");
    }
    const isReport = await prisma.user.findFirst({
      where: { id: sheet.employeeId, managerId: actorId },
    });
    if (!isReport) throw forbidden("You can only edit goals of your direct reports.");
  }

  // Shared goal immutability — title and target are read-only on copies
  if (goal.isShared) {
    if (data.title !== undefined || data.target !== undefined || data.targetDate !== undefined) {
      throw forbidden("Title and target fields are immutable on shared goal copies.");
    }
  }

  // Collect changed fields for audit log (post-lock edits)
  const auditEntries: Array<{
    fieldName: string;
    oldValue: string;
    newValue: string;
  }> = [];

  if (sheet.locked) {
    const fields = Object.keys(data) as (keyof UpdateGoalBody)[];
    for (const field of fields) {
      const oldVal = String((goal as any)[field] ?? "");
      const newVal = String((data as any)[field] ?? "");
      if (oldVal !== newVal) {
        auditEntries.push({ fieldName: field, oldValue: oldVal, newValue: newVal });
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedGoal = await tx.goal.update({
      where: { id: goalId },
      data: {
        ...(data.thrustArea !== undefined && { thrustArea: data.thrustArea }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.uomType !== undefined && { uomType: data.uomType }),
        ...(data.target !== undefined && { target: data.target }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
        ...(data.weightage !== undefined && { weightage: data.weightage }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { achievements: true },
    });

    // Write audit logs if editing a locked sheet
    if (sheet.locked && auditEntries.length > 0) {
      await tx.auditLog.createMany({
        data: auditEntries.map((entry) => ({
          entityType: AuditEntityType.GOAL,
          entityId: goalId,
          actorId,
          action: AuditAction.EDIT,
          fieldName: entry.fieldName,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          goalId,
        })),
      });
    }

    return updatedGoal;
  });

  return updated;
}

export async function deleteGoal(
  prisma: PrismaClient,
  goalId: string,
  employeeId: string
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });
  if (!goal) throw notFound("Goal");
  if (goal.goalSheet.employeeId !== employeeId) throw forbidden();
  if (
    goal.goalSheet.status !== GoalSheetStatus.DRAFT &&
    goal.goalSheet.status !== GoalSheetStatus.RETURNED
  ) {
    throw conflict("Goals can only be deleted when the sheet is in DRAFT or RETURNED status.");
  }

  await prisma.goal.delete({ where: { id: goalId } });
}

export async function shareGoal(
  prisma: PrismaClient,
  managerId: string,
  data: ShareGoalBody
) {
  const sourceGoal = await prisma.goal.findUnique({
    where: { id: data.sourceGoalId },
    include: { goalSheet: { include: { cycle: true } } },
  });
  if (!sourceGoal) throw notFound("Source Goal");

  const cycleId = sourceGoal.goalSheet.cycleId;

  // Validate target employees are direct reports
  const reports = await prisma.user.findMany({
    where: {
      id: { in: data.targetEmployeeIds },
      managerId,
    },
    select: { id: true },
  });

  if (reports.length !== data.targetEmployeeIds.length) {
    throw forbidden("You can only share goals with your direct reports.");
  }

  // Transactionally create copies on each target employee's sheet
  const created = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const employee of reports) {
      // Get or create goal sheet for this employee in the cycle
      let sheet = await tx.goalSheet.findUnique({
        where: { employeeId_cycleId: { employeeId: employee.id, cycleId } },
        include: { goals: true },
      });

      if (!sheet) {
        sheet = await tx.goalSheet.create({
          data: { employeeId: employee.id, cycleId },
          include: { goals: true },
        });
      }

      if ((sheet as any).goals.length >= 8) {
        continue; // Skip — at capacity
      }

      const copy = await tx.goal.create({
        data: {
          goalSheetId: sheet.id,
          thrustArea: sourceGoal.thrustArea,
          title: sourceGoal.title,
          description: sourceGoal.description,
          uomType: sourceGoal.uomType,
          target: sourceGoal.target,
          targetDate: sourceGoal.targetDate,
          weightage: data.weightage,
          isShared: true,
          sharedFromId: sourceGoal.id,
          status: sourceGoal.status,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.GOAL,
          entityId: copy.id,
          actorId: managerId,
          action: AuditAction.SHARE,
          newValue: `Shared from goal ${sourceGoal.id} to employee ${employee.id}`,
          goalId: copy.id,
        },
      });

      results.push(copy);
    }

    return results;
  });

  return created;
}
