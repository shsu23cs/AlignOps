import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { CreateUserBody, UpdateUserBody } from "./schema";
import { notFound, conflict } from "../../lib/errors";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  managerId: true,
  createdAt: true,
};

export async function getMe(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) throw notFound("User");
  return user;
}

export async function listUsers(prisma: PrismaClient) {
  return prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(prisma: PrismaClient, data: CreateUserBody) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw conflict(`A user with email ${data.email} already exists.`);

  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      department: data.department,
      managerId: data.managerId ?? null,
    },
    select: USER_SELECT,
  });
}

export async function updateUser(
  prisma: PrismaClient,
  userId: string,
  data: UpdateUserBody
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User");

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.managerId !== undefined && { managerId: data.managerId }),
    },
    select: USER_SELECT,
  });
}

export async function getDirectReports(prisma: PrismaClient, managerId: string) {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  if (!manager) throw notFound("Manager");

  return prisma.user.findMany({
    where: { managerId },
    select: USER_SELECT,
    orderBy: { name: "asc" },
  });
}
