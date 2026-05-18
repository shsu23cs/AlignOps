/**
 * Cycle Window Guard
 * Checks that a matching active cycle phase exists and the server time is within its window.
 * Throws 422 WINDOW_CLOSED if not.
 */

import { PrismaClient, CyclePhase } from "@prisma/client";
import { windowClosed } from "./errors";

/**
 * Accepts both PrismaClient and Prisma interactive transaction client.
 * Prisma's $transaction callback receives an `Omit<PrismaClient, ...>` type,
 * so we use a pick-style type to support both.
 */
type PrismaClientLike = Pick<PrismaClient, "cycle">;

export async function assertWindowOpen(
  prisma: PrismaClientLike,
  phase: CyclePhase
): Promise<void> {
  const now = new Date();

  const cycle = await prisma.cycle.findFirst({
    where: {
      phase,
      isActive: true,
      windowOpen: { lte: now },
      windowClose: { gte: now },
    },
  });

  if (!cycle) {
    throw windowClosed(phase);
  }
}
