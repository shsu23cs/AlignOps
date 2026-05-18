/**
 * Role Guard Middleware
 * Returns a Fastify preHandler that asserts the authenticated user has one of the required roles.
 *
 * IMPORTANT: Each guard function returns `reply.send()` on failure to properly abort
 * the Fastify request lifecycle. Without the return, the route handler would still execute.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { JwtPayload } from "../plugins/jwt";

export function requireRole(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Ensure the user is authenticated first
    try {
      await request.jwtVerify<JwtPayload>();
    } catch {
      return reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authentication token.",
          details: [],
        },
      }) as unknown as void;
    }

    const user = request.user as JwtPayload;
    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        error: {
          code: "FORBIDDEN",
          message: `This action requires one of the following roles: ${roles.join(", ")}.`,
          details: [],
        },
      }) as unknown as void;
    }
  };
}

/** Shorthand guards */
export const requireAdmin = requireRole(Role.ADMIN);
export const requireManager = requireRole(Role.MANAGER, Role.ADMIN);
export const requireEmployee = requireRole(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN);
