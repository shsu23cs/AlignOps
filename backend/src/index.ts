/**
 * AlignOps Backend — Server Entry Point
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

import { prismaPlugin } from "./plugins/prisma";
import { jwtPlugin } from "./plugins/jwt";

import { authRoutes } from "./modules/auth/routes";
import { userRoutes } from "./modules/users/routes";
import { cycleRoutes } from "./modules/cycles/routes";
import { goalSheetRoutes } from "./modules/goal-sheets/routes";
import { goalRoutes } from "./modules/goals/routes";
import { achievementRoutes } from "./modules/achievements/routes";
import { checkinCommentRoutes } from "./modules/checkin-comments/routes";
import { reportRoutes } from "./modules/reports/routes";
import { auditLogRoutes } from "./modules/audit-log/routes";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "warn" : "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  // ── Global Plugins ──────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests — please slow down.",
        details: [],
      },
    }),
  });

  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);

  // ── Health Check ────────────────────────────────────────────────────────
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }));

  // ── API Routes ──────────────────────────────────────────────────────────
  const apiPrefix = { prefix: "/api/v1" };
  await fastify.register(authRoutes, apiPrefix);
  await fastify.register(userRoutes, apiPrefix);
  await fastify.register(cycleRoutes, apiPrefix);
  await fastify.register(goalSheetRoutes, apiPrefix);
  await fastify.register(goalRoutes, apiPrefix);
  await fastify.register(achievementRoutes, apiPrefix);
  await fastify.register(checkinCommentRoutes, apiPrefix);
  await fastify.register(reportRoutes, apiPrefix);
  await fastify.register(auditLogRoutes, apiPrefix);

  // ── Global Error Handler ─────────────────────────────────────────────────
  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode || 500;

    // Structured domain errors pass through their payload as-is
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: "BAD_REQUEST",
          message: "Request validation failed.",
          details: error.validation,
        },
      });
    }

    if ((error as any).isAppError) {
      return reply.status(statusCode).send({ error: (error as any).payload });
    }

    fastify.log.error(error);
    return reply.status(statusCode).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred."
            : error.message,
        details: [],
      },
    });
  });

  // ── 404 Handler ──────────────────────────────────────────────────────────
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource does not exist.",
        details: [],
      },
    });
  });

  return fastify;
}

import { startEscalationJobs } from "./jobs/escalation";

async function start() {
  const server = await buildServer();
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 AlignOps API running at http://${HOST}:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api/v1\n`);
    
    // Start background jobs
    startEscalationJobs(server);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

export { buildServer };

