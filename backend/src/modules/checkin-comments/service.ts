import { PrismaClient } from "@prisma/client";
import { notFound, forbidden } from "../../lib/errors";
import { CheckinCommentBody } from "./schema";

export async function listComments(prisma: PrismaClient, sheetId: string) {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw notFound("GoalSheet");

  return prisma.checkinComment.findMany({
    where: { goalSheetId: sheetId },
    include: { manager: { select: { id: true, name: true } } },
    orderBy: [{ cyclePhase: "asc" }, { createdAt: "desc" }],
  });
}

export async function upsertComment(
  prisma: PrismaClient,
  sheetId: string,
  managerId: string,
  data: CheckinCommentBody
) {
  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw notFound("GoalSheet");

  // Manager scope check
  const isReport = await prisma.user.findFirst({
    where: { id: sheet.employeeId, managerId },
  });
  if (!isReport) {
    throw forbidden("You can only add check-in comments for your direct reports.");
  }

  return prisma.checkinComment.upsert({
    where: {
      goalSheetId_managerId_cyclePhase: {
        goalSheetId: sheetId,
        managerId,
        cyclePhase: data.cyclePhase,
      },
    },
    create: {
      goalSheetId: sheetId,
      managerId,
      cyclePhase: data.cyclePhase,
      comment: data.comment,
    },
    update: { comment: data.comment },
    include: { manager: { select: { id: true, name: true } } },
  });
}
