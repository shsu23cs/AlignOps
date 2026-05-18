import { PrismaClient, GoalSheetStatus, CyclePhase, AuditAction, AuditEntityType } from "@prisma/client";
import { assertWindowOpen } from "../../lib/cycle-guard";
import { notFound, forbidden, conflict, unprocessable } from "../../lib/errors";

const SHEET_INCLUDE = {
  employee: { select: { id: true, name: true, email: true, department: true } },
  cycle: true,
  goals: {
    include: {
      achievements: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  checkinComments: {
    include: { manager: { select: { id: true, name: true } } },
  },
  approvedBy: { select: { id: true, name: true } },
};

export async function getMySheet(
  prisma: PrismaClient,
  employeeId: string,
  cycleId: string
) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { employeeId_cycleId: { employeeId, cycleId } },
    include: SHEET_INCLUDE,
  });

  if (!sheet) {
    // Auto-create if the GOAL_SETTING window is active
    const activeCycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!activeCycle) throw notFound("Cycle");

    return prisma.goalSheet.create({
      data: { employeeId, cycleId },
      include: SHEET_INCLUDE,
    });
  }
  return sheet;
}

export async function getSheet(
  prisma: PrismaClient,
  sheetId: string,
  requesterId: string,
  requesterRole: string,
  requesterManagerId: string | null
) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: SHEET_INCLUDE,
  });

  if (!sheet) throw notFound("GoalSheet");

  // Access control
  if (requesterRole === "EMPLOYEE" && sheet.employeeId !== requesterId) {
    throw forbidden();
  }

  if (requesterRole === "MANAGER") {
    const report = await prisma.user.findFirst({
      where: { id: sheet.employeeId, managerId: requesterId },
    });
    if (!report) throw forbidden("You can only access your direct reports' goal sheets.");
  }

  return sheet;
}

export async function listTeamSheets(
  prisma: PrismaClient,
  managerId: string,
  cycleId?: string
) {
  // Get all direct reports
  const reports = await prisma.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  const reportIds = reports.map((r) => r.id);

  return prisma.goalSheet.findMany({
    where: {
      employeeId: { in: reportIds },
      ...(cycleId && { cycleId }),
    },
    include: SHEET_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function submitSheet(
  prisma: PrismaClient,
  sheetId: string,
  employeeId: string
) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true, cycle: true },
  });

  if (!sheet) throw notFound("GoalSheet");
  if (sheet.employeeId !== employeeId) throw forbidden();

  // Must be in DRAFT or RETURNED
  if (sheet.status !== GoalSheetStatus.DRAFT && sheet.status !== GoalSheetStatus.RETURNED) {
    throw conflict(
      `Goal sheet cannot be submitted — current status is ${sheet.status}.`
    );
  }

  // Window must be open
  await assertWindowOpen(prisma, CyclePhase.GOAL_SETTING);

  // Business rule validations
  const validationErrors: { field: string; message: string }[] = [];
  const goals = sheet.goals;

  if (goals.length === 0) {
    validationErrors.push({
      field: "goals",
      message: "At least one goal is required before submission.",
    });
  }

  if (goals.length > 8) {
    validationErrors.push({
      field: "goal_count",
      message: `Maximum 8 goals allowed per sheet. Currently has ${goals.length}.`,
    });
  }

  const totalWeightage = goals.reduce(
    (sum, g) => sum + Number(g.weightage),
    0
  );

  if (Math.abs(totalWeightage - 100) > 0.01) {
    validationErrors.push({
      field: "weightage_total",
      message: `Total weightage is ${totalWeightage.toFixed(2)}% — must equal exactly 100%.`,
    });
  }

  goals.forEach((goal, index) => {
    if (Number(goal.weightage) < 10) {
      validationErrors.push({
        field: `goals[${index}].weightage`,
        message: `Goal "${goal.title}" has weightage ${goal.weightage}% — minimum is 10%.`,
      });
    }
  });

  if (validationErrors.length > 0) {
    throw unprocessable("Goal sheet cannot be submitted.", validationErrors);
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: {
      status: GoalSheetStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
    },
    include: SHEET_INCLUDE,
  });

  // MS Teams Notification
  import("../../lib/teams").then(async (teams) => {
    if (updated.employee && (updated as any).employee.managerId) {
      const manager = await prisma.user.findUnique({ where: { id: (updated as any).employee.managerId } });
      if (manager) {
        teams.notifyManagerOnSubmission(
          updated.employee, 
          manager, 
          `FY ${updated.cycle.year} - ${updated.cycle.phase}`
        );
      }
    } else {
      // Find manager if not in employee object
      const employeeWithManager = await prisma.user.findUnique({ where: { id: updated.employee.id } });
      if (employeeWithManager?.managerId) {
        const manager = await prisma.user.findUnique({ where: { id: employeeWithManager.managerId } });
        if (manager) {
          teams.notifyManagerOnSubmission(
            updated.employee, 
            manager, 
            `FY ${updated.cycle.year} - ${updated.cycle.phase}`
          );
        }
      }
    }
  }).catch(err => console.error(err));

  return updated;
}

export async function approveSheet(
  prisma: PrismaClient,
  sheetId: string,
  managerId: string
) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { employee: true },
  });

  if (!sheet) throw notFound("GoalSheet");

  // Manager scope check
  const isReport = await prisma.user.findFirst({
    where: { id: sheet.employeeId, managerId },
  });
  if (!isReport) throw forbidden("You can only approve goal sheets of your direct reports.");

  if (sheet.status !== GoalSheetStatus.PENDING_APPROVAL) {
    throw conflict(`Sheet must be in PENDING_APPROVAL status to approve. Current: ${sheet.status}`);
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: {
      status: GoalSheetStatus.APPROVED,
      locked: true,
      approvedAt: new Date(),
      approvedById: managerId,
    },
    include: SHEET_INCLUDE,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      entityType: AuditEntityType.GOAL_SHEET,
      entityId: sheetId,
      actorId: managerId,
      action: AuditAction.APPROVE,
      newValue: GoalSheetStatus.APPROVED,
      goalSheetId: sheetId,
    },
  });

  // MS Teams Notification
  import("../../lib/teams").then(async (teams) => {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (manager) {
      teams.notifyEmployeeOnDecision(
        updated.employee,
        manager,
        GoalSheetStatus.APPROVED,
        `FY ${updated.cycle.year} - ${updated.cycle.phase}`
      );
    }
  }).catch(err => console.error(err));

  return updated;
}

export async function returnSheet(
  prisma: PrismaClient,
  sheetId: string,
  managerId: string,
  returnReason: string
) {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw notFound("GoalSheet");

  const isReport = await prisma.user.findFirst({
    where: { id: sheet.employeeId, managerId },
  });
  if (!isReport) throw forbidden("You can only return goal sheets of your direct reports.");

  if (sheet.status !== GoalSheetStatus.PENDING_APPROVAL) {
    throw conflict(`Sheet must be in PENDING_APPROVAL status to return. Current: ${sheet.status}`);
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: {
      status: GoalSheetStatus.RETURNED,
      returnReason,
      locked: false,
    },
    include: SHEET_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      entityType: AuditEntityType.GOAL_SHEET,
      entityId: sheetId,
      actorId: managerId,
      action: AuditAction.RETURN,
      newValue: returnReason,
      goalSheetId: sheetId,
    },
  });

  // MS Teams Notification
  import("../../lib/teams").then(async (teams) => {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (manager) {
      teams.notifyEmployeeOnDecision(
        updated.employee,
        manager,
        GoalSheetStatus.RETURNED,
        `FY ${updated.cycle.year} - ${updated.cycle.phase}`,
        returnReason
      );
    }
  }).catch(err => console.error(err));

  return updated;
}

export async function unlockSheet(
  prisma: PrismaClient,
  sheetId: string,
  adminId: string
) {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw notFound("GoalSheet");

  if (!sheet.locked) {
    throw conflict("Goal sheet is not currently locked.");
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: { status: GoalSheetStatus.DRAFT, locked: false },
    include: SHEET_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      entityType: AuditEntityType.GOAL_SHEET,
      entityId: sheetId,
      actorId: adminId,
      action: AuditAction.UNLOCK,
      oldValue: "locked=true",
      newValue: "locked=false",
      goalSheetId: sheetId,
    },
  });

  return updated;
}
