/**
 * JWT Fastify Plugin
 * Configures @fastify/jwt and exposes the `authenticate` preHandler
 */

import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string;       // user id
  role: Role;
  managerId: string | null;
  iat?: number;
  exp?: number;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

async function jwtPluginFn(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set!");
  }

  await fastify.register(fastifyJwt, {
    secret,
    sign: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify<JwtPayload>();
      } catch (_err) {
        return reply.status(401).send({
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid authentication token.",
            details: [],
          },
        });
      }
    }
  );
}

export const jwtPlugin = fp(jwtPluginFn, { name: "jwt" });
