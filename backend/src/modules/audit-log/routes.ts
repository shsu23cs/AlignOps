import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAdmin } from "../../lib/guards";
import { listAuditLogs } from "./service";

const AuditLogQuerySchema = z.object({
  entityId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function auditLogRoutes(fastify: FastifyInstance) {
  /** GET /api/v1/audit-log — Admin only */
  fastify.get(
    "/audit-log",
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = AuditLogQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid query parameters.",
            details: query.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        });
      }

      const result = await listAuditLogs(fastify.prisma, query.data);
      return reply.send(result);
    }
  );
}
