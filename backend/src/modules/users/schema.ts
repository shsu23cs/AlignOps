import { z } from "zod";
import { Role } from "@prisma/client";

export const CreateUserBodySchema = z.object({
  name: z.string().min(1).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  role: z.nativeEnum(Role),
  department: z.string().min(1).trim(),
  managerId: z.string().uuid().nullable().optional(),
});

export const UpdateUserBodySchema = z.object({
  name: z.string().min(1).trim().optional(),
  role: z.nativeEnum(Role).optional(),
  department: z.string().min(1).trim().optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;

export const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.nativeEnum(Role),
  department: z.string(),
  managerId: z.string().nullable(),
  createdAt: z.date(),
});
