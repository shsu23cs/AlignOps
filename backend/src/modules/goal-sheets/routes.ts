import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { requireAdmin, requireManager } from "../../lib/guards";
import { ReturnSheetBodySchema, GoalSheetQuerySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as goalSheetService from "./service";

interface IdParams {
  id: string;
}

export async function goalSheetRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/v1/goal-sheets
   * Manager or Admin — list team sheets
   * MUST be registered BEFORE the /:id parametric route to avoid conflicts.
   */
  fastify.get(
    "/goal-sheets",
    { preHandler: [requireManager] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const query = GoalSheetQuerySchema.safeParse(request.query);

      // Determine target manager ID
      const targetManagerId = (request.query as any).managerId || user.sub;

      // Managers can only view their own team
      if (user.role === Role.MANAGER && targetManagerId !== user.sub) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "You can only view your own team sheets.", details: [] },
        });
      }

      const result = await goalSheetService.listTeamSheets(
        fastify.prisma,
        targetManagerId,
        query.data?.cycleId
      );
      return reply.send(result);
    }
  );

  /**
   * GET /api/v1/goal-sheets/mine?cycleId=
   * Static path — MUST be registered BEFORE /:id to avoid ":id = mine" matching.
   */
  fastify.get(
    "/goal-sheets/mine",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const query = GoalSheetQuerySchema.safeParse(request.query);
      if (!query.success || !query.data.cycleId) {
        return reply.status(400).send({
          error: { code: "BAD_REQUEST", message: "cycleId query parameter is required.", details: [] },
        });
      }
      const result = await goalSheetService.getMySheet(
        fastify.prisma,
        user.sub,
        query.data.cycleId
      );
      return reply.send(result);
    }
  );

  /** GET /api/v1/goal-sheets/:id */
  fastify.get<{ Params: IdParams }>(
    "/goal-sheets/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const result = await goalSheetService.getSheet(
        fastify.prisma,
        request.params.id,
        user.sub,
        user.role,
        user.managerId
      );
      return reply.send(result);
    }
  );

  /** POST /api/v1/goal-sheets/:id/submit */
  fastify.post<{ Params: IdParams }>(
    "/goal-sheets/:id/submit",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const result = await goalSheetService.submitSheet(
        fastify.prisma,
        request.params.id,
        user.sub
      );
      return reply.send(result);
    }
  );

  /** POST /api/v1/goal-sheets/:id/approve — Manager or Admin */
  fastify.post<{ Params: IdParams }>(
    "/goal-sheets/:id/approve",
    { preHandler: [requireManager] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const result = await goalSheetService.approveSheet(
        fastify.prisma,
        request.params.id,
        user.sub
      );
      return reply.send(result);
    }
  );

  /** POST /api/v1/goal-sheets/:id/return — Manager or Admin */
  fastify.post<{ Params: IdParams }>(
    "/goal-sheets/:id/return",
    { preHandler: [requireManager] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const body = ReturnSheetBodySchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(422).send({
          error: {
            code: "VALIDATION_FAILED",
            message: "Return reason is required.",
            details: [{ field: "return_reason", message: "Must be at least 10 characters." }],
          },
        });
      }
      const result = await goalSheetService.returnSheet(
        fastify.prisma,
        request.params.id,
        user.sub,
        body.data.returnReason
      );
      return reply.send(result);
    }
  );

  /** POST /api/v1/goal-sheets/:id/unlock — Admin only */
  fastify.post<{ Params: IdParams }>(
    "/goal-sheets/:id/unlock",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const result = await goalSheetService.unlockSheet(
        fastify.prisma,
        request.params.id,
        user.sub
      );
      return reply.send(result);
    }
  );
}
