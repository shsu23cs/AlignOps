import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { CyclePhase } from "@prisma/client";
import { UpsertAchievementBodySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as achievementService from "./service";

interface GoalIdParams {
  goalId: string;
}

interface GoalPhaseParams {
  goalId: string;
  phase: string;
}

export async function achievementRoutes(fastify: FastifyInstance) {
  /** GET /api/v1/goals/:goalId/achievements */
  fastify.get<{ Params: GoalIdParams }>(
    "/goals/:goalId/achievements",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const result = await achievementService.listAchievements(
        fastify.prisma,
        request.params.goalId,
        user.sub,
        user.role
      );
      return reply.send(result);
    }
  );

  /** PUT /api/v1/goals/:goalId/achievements/:phase */
  fastify.put<{ Params: GoalPhaseParams }>(
    "/goals/:goalId/achievements/:phase",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload;

      // Validate phase param
      const validPhases = ["Q1", "Q2", "Q3", "Q4"] as const;
      const phase = request.params.phase.toUpperCase() as CyclePhase;
      if (!validPhases.includes(phase as any)) {
        return reply.status(400).send({
          error: {
            code: "BAD_REQUEST",
            message: `Invalid phase "${request.params.phase}". Must be Q1, Q2, Q3, or Q4.`,
            details: [],
          },
        });
      }

      const body = UpsertAchievementBodySchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid request body.",
            details: body.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        });
      }

      const result = await achievementService.upsertAchievement(
        fastify.prisma,
        request.params.goalId,
        phase,
        body.data,
        user.sub
      );
      return reply.send(result);
    }
  );
}
