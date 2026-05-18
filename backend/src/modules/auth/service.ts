import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { LoginBody, RefreshBody, AuthTokenResponse } from "./schema";
import { unauthorized } from "../../lib/errors";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function msFromExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const map: Record<string, number> = { m: 60000, h: 3600000, d: 86400000 };
  return value * (map[unit] || 60000);
}

export async function login(
  prisma: PrismaClient,
  fastify: FastifyInstance,
  body: LoginBody
): Promise<AuthTokenResponse> {
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  if (!user) throw unauthorized("Invalid email or password.");

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw unauthorized("Invalid email or password.");

  // Generate access token via fastify-jwt
  const accessToken = fastify.jwt.sign(
    { sub: user.id, role: user.role, managerId: user.managerId },
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  // Generate refresh token (stored in DB)
  const rawRefreshToken = randomUUID();
  const expiresAt = new Date(Date.now() + msFromExpiry(REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: { token: rawRefreshToken, userId: user.id, expiresAt },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      managerId: user.managerId,
    },
  };
}

export async function refresh(
  prisma: PrismaClient,
  fastify: FastifyInstance,
  body: RefreshBody
): Promise<{ accessToken: string }> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: body.refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    // Clean up expired token if it exists
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    throw unauthorized("Refresh token is invalid or has expired.");
  }

  const accessToken = fastify.jwt.sign(
    {
      sub: stored.user.id,
      role: stored.user.role,
      managerId: stored.user.managerId,
    },
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  return { accessToken };
}

export async function logout(
  prisma: PrismaClient,
  refreshToken: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}
