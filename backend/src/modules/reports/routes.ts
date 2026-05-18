import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireManager, requireAdmin } from "../../lib/guards";
import { CompletionReportQuerySchema, AchievementReportQuerySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as reportService from "./service";

export async function reportRoutes(fastify: FastifyInstance) {
  /** GET /api/v1/reports/completion */
  fastify.get(
    "/reports/completion",
    { preHandler: [requireManager] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const query = CompletionReportQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({
          error: { code: "BAD_REQUEST", message: "Invalid query parameters.", details: [] },
        });
      }

      const result = await reportService.completionReport(
        fastify.prisma,
        query.data,
        user.sub,
        user.role
      );
      return reply.send(result);
    }
  );

  /** GET /api/v1/reports/achievement */
  fastify.get(
    "/reports/achievement",
    { preHandler: [requireManager] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const query = AchievementReportQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({
          error: { code: "BAD_REQUEST", message: "Invalid query parameters.", details: [] },
        });
      }

      const result = await reportService.achievementReport(
        fastify.prisma,
        query.data,
        user.sub,
        user.role
      );
      return reply.send(result);
    }
  );

  /** GET /api/v1/reports/achievement/export — Admin only */
  fastify.get(
    "/reports/achievement/export",
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = AchievementReportQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({
          error: { code: "BAD_REQUEST", message: "Invalid query parameters.", details: [] },
        });
      }

      const csvContent = await reportService.exportAchievementCsv(
        fastify.prisma,
        query.data
      );

      reply
        .header("Content-Type", "text/csv")
        .header(
          "Content-Disposition",
          `attachment; filename="achievement-report-${new Date().toISOString().slice(0, 10)}.csv"`
        )
        .send(csvContent);
    }
  );
}
