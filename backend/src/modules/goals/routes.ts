import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireManager } from "../../lib/guards";
import { GoalBodySchema, UpdateGoalBodySchema, ShareGoalBodySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as goalService from "./service";

interface SheetIdParams {
  sheetId: string;
}

interface IdParams {
  id: string;
}

function parseBody(schema: any, body: unknown, reply: FastifyReply) {
  const result = schema.safeParse(body);
  if (!result.success) {
    reply.status(400).send({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid request body.",
        details: result.error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
    return null;
  }
  return result.data;
}

export async function goalRoutes(fastify: FastifyInstance) {
  /** GET /api/v1/goal-sheets/:sheetId/goals */
  fastify.get<{ Params: SheetIdParams }>(
    "/goal-sheets/:sheetId/goals",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const result = await goalService.listGoals(
        fastify.prisma,
        request.params.sheetId,
        user.sub,
        user.role
      );
      return reply.send(result);
    }
  );

  /** POST /api/v1/goal-sheets/:sheetId/goals */
  fastify.post<{ Params: SheetIdParams }>(
    "/goal-sheets/:sheetId/goals",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const body = parseBody(GoalBodySchema, request.body, reply);
      if (!body) return;

      const result = await goalService.addGoal(
        fastify.prisma,
        request.params.sheetId,
        user.sub,
        body
      );
      return reply.status(201).send(result);
    }
  );

  /** PATCH /api/v1/goals/:id */
  fastify.patch<{ Params: IdParams }>(
    "/goals/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const body = parseBody(UpdateGoalBodySchema, request.body, reply);
      if (!body) return;

      const result = await goalService.updateGoal(
        fastify.prisma,
        request.params.id,
        body,
        user.sub,
        user.role
      );
      return reply.send(result);
    }
  );

  /** DELETE /api/v1/goals/:id */
  fastify.delete<{ Params: IdParams }>(
    "/goals/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      await goalService.deleteGoal(fastify.prisma, request.params.id, user.sub);
      return reply.status(204).send();
    }
  );

  /** POST /api/v1/goals/share — Manager or Admin */
  fastify.post(
    "/goals/share",
    { preHandler: [requireManager] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const body = parseBody(ShareGoalBodySchema, request.body, reply);
      if (!body) return;

      const result = await goalService.shareGoal(fastify.prisma, user.sub, body);
      return reply.status(201).send({ shared: result.length, goals: result });
    }
  );
}
