import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAdmin } from "../../lib/guards";
import { CreateCycleBodySchema, UpdateCycleBodySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as cycleService from "./service";

interface IdParams {
  id: string;
}

export async function cycleRoutes(fastify: FastifyInstance) {
  /** GET /api/v1/cycles */
  fastify.get(
    "/cycles",
    { preHandler: [fastify.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const result = await cycleService.listCycles(fastify.prisma);
      return reply.send(result);
    }
  );

  /** GET /api/v1/cycles/active */
  fastify.get(
    "/cycles/active",
    { preHandler: [fastify.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const result = await cycleService.getActiveCycles(fastify.prisma);
      return reply.send(result);
    }
  );

  /** POST /api/v1/cycles — Admin only */
  fastify.post(
    "/cycles",
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = CreateCycleBodySchema.safeParse(request.body);
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
      const admin = request.user as JwtPayload;
      const result = await cycleService.createCycle(
        fastify.prisma,
        body.data,
        admin.sub
      );
      return reply.status(201).send(result);
    }
  );

  /** PATCH /api/v1/cycles/:id — Admin only */
  fastify.patch<{ Params: IdParams }>(
    "/cycles/:id",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const body = UpdateCycleBodySchema.safeParse(request.body);
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
      const result = await cycleService.updateCycle(
        fastify.prisma,
        request.params.id,
        body.data
      );
      return reply.send(result);
    }
  );
}
