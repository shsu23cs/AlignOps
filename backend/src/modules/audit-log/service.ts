import { PrismaClient, AuditEntityType, AuditAction } from "@prisma/client";

export interface AuditLogFilters {
  entityId?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export async function listAuditLogs(
  prisma: PrismaClient,
  filters: AuditLogFilters
) {
  const { entityId, actorId, from, to, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (entityId) where.entityId = entityId;
  if (actorId) where.actorId = actorId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data: logs, total, page, limit };
}
