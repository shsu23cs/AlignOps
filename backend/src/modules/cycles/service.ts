import { PrismaClient } from "@prisma/client";
import { CreateCycleBody, UpdateCycleBody } from "./schema";
import { notFound, conflict } from "../../lib/errors";

export async function listCycles(prisma: PrismaClient) {
  return prisma.cycle.findMany({
    orderBy: [{ year: "desc" }, { phase: "asc" }],
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export async function getActiveCycles(prisma: PrismaClient) {
  const now = new Date();
  return prisma.cycle.findMany({
    where: {
      isActive: true,
      windowOpen: { lte: now },
      windowClose: { gte: now },
    },
    orderBy: [{ year: "desc" }, { phase: "asc" }],
  });
}

export async function createCycle(
  prisma: PrismaClient,
  data: CreateCycleBody,
  adminId: string
) {
  if (data.windowClose <= data.windowOpen) {
    throw conflict("windowClose must be after windowOpen.");
  }

  return prisma.cycle.create({
    data: {
      year: data.year,
      phase: data.phase,
      windowOpen: data.windowOpen,
      windowClose: data.windowClose,
      isActive: data.isActive,
      createdById: adminId,
    },
  });
}

export async function updateCycle(
  prisma: PrismaClient,
  cycleId: string,
  data: UpdateCycleBody
) {
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw notFound("Cycle");

  const windowOpen = data.windowOpen ?? cycle.windowOpen;
  const windowClose = data.windowClose ?? cycle.windowClose;

  if (windowClose <= windowOpen) {
    throw conflict("windowClose must be after windowOpen.");
  }

  return prisma.cycle.update({
    where: { id: cycleId },
    data: {
      ...(data.windowOpen !== undefined && { windowOpen: data.windowOpen }),
      ...(data.windowClose !== undefined && { windowClose: data.windowClose }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}
