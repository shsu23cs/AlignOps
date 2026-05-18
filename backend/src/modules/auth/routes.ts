import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { LoginBodySchema, RefreshBodySchema, LogoutBodySchema } from "./schema";
import * as authService from "./service";

export async function authRoutes(fastify: FastifyInstance) {
  /** POST /api/v1/auth/login */
  fastify.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = LoginBodySchema.safeParse(request.body);
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

    const result = await authService.login(fastify.prisma, fastify, body.data);
    return reply.status(200).send(result);
  });

  /** POST /api/v1/auth/refresh */
  fastify.post("/auth/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RefreshBodySchema.safeParse(request.body);
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

    const result = await authService.refresh(fastify.prisma, fastify, body.data);
    return reply.status(200).send(result);
  });

  /** POST /api/v1/auth/logout */
  fastify.post(
    "/auth/logout",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = LogoutBodySchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: "BAD_REQUEST", message: "Refresh token is required.", details: [] },
        });
      }

      await authService.logout(fastify.prisma, body.data.refreshToken);
      return reply.status(200).send({ message: "Logged out successfully." });
    }
  );

  /** GET /api/v1/auth/sso/microsoft */
  fastify.get("/auth/sso/microsoft", async (request: FastifyRequest, reply: FastifyReply) => {
    const sso = await import("./sso");
    const url = sso.getAuthorizationUrl();
    return reply.redirect(url);
  });

  /** GET /api/v1/auth/sso/microsoft/callback */
  fastify.get("/auth/sso/microsoft/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.query as { code?: string };
    if (!code) {
      return reply.status(400).send({ error: "No authorization code provided" });
    }

    try {
      const sso = await import("./sso");
      const result = await sso.handleSsoCallback(fastify.prisma, fastify, code);
      
      // Redirect back to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: encodeURIComponent(JSON.stringify(result.user)),
      });
      return reply.redirect(`${frontendUrl}/login?${params.toString()}`);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "SSO Login failed", message: err.message });
    }
  });
}
