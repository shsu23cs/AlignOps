import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireManager } from "../../lib/guards";
import { CheckinCommentBodySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as checkinService from "./service";

interface SheetIdParams {
  sheetId: string;
}

export async function checkinCommentRoutes(fastify: FastifyInstance) {
  /** GET /api/v1/goal-sheets/:sheetId/checkin-comments */
  fastify.get<{ Params: SheetIdParams }>(
    "/goal-sheets/:sheetId/checkin-comments",
    { preHandler: [requireManager] },
    async (request, reply) => {
      const result = await checkinService.listComments(
        fastify.prisma,
        request.params.sheetId
      );
      return reply.send(result);
    }
  );

  /** POST /api/v1/goal-sheets/:sheetId/checkin-comments */
  fastify.post<{ Params: SheetIdParams }>(
    "/goal-sheets/:sheetId/checkin-comments",
    { preHandler: [requireManager] },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const body = CheckinCommentBodySchema.safeParse(request.body);
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

      const result = await checkinService.upsertComment(
        fastify.prisma,
        request.params.sheetId,
        user.sub,
        body.data
      );
      return reply.status(200).send(result);
    }
  );
}
