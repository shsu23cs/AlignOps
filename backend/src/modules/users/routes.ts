import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { requireAdmin, requireManager } from "../../lib/guards";
import { CreateUserBodySchema, UpdateUserBodySchema } from "./schema";
import { JwtPayload } from "../../plugins/jwt";
import * as userService from "./service";

interface IdParams {
  id: string;
}

export async function userRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/v1/users
   * Admin only — list all users.
   * MUST be registered BEFORE /:id to avoid conflict.
   */
  fastify.get(
    "/users",
    { preHandler: [requireAdmin] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const result = await userService.listUsers(fastify.prisma);
      return reply.send(result);
    }
  );

  /**
   * GET /api/v1/users/me
   * Static path — MUST be registered BEFORE /:id to avoid ":id = me" matching.
   */
  fastify.get(
    "/users/me",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const result = await userService.getMe(fastify.prisma, user.sub);
      return reply.send(result);
    }
  );

  /** POST /api/v1/users — Admin only */
  fastify.post(
    "/users",
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = CreateUserBodySchema.safeParse(request.body);
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
      const result = await userService.createUser(fastify.prisma, body.data);
      return reply.status(201).send(result);
    }
  );

  /** PATCH /api/v1/users/:id — Admin only */
  fastify.patch<{ Params: IdParams }>(
    "/users/:id",
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const body = UpdateUserBodySchema.safeParse(request.body);
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
      const result = await userService.updateUser(
        fastify.prisma,
        request.params.id,
        body.data
      );
      return reply.send(result);
    }
  );

  /** GET /api/v1/users/:id/direct-reports — Manager or Admin */
  fastify.get<{ Params: IdParams }>(
    "/users/:id/direct-reports",
    { preHandler: [requireManager] },
    async (request, reply) => {
      const requester = request.user as JwtPayload;

      // Managers can only view their own direct reports
      if (
        requester.role === Role.MANAGER &&
        requester.sub !== request.params.id
      ) {
        return reply.status(403).send({
          error: {
            code: "FORBIDDEN",
            message: "You can only view your own direct reports.",
            details: [],
          },
        });
      }

      const result = await userService.getDirectReports(
        fastify.prisma,
        request.params.id
      );
      return reply.send(result);
    }
  );
}
