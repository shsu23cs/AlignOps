import { z } from "zod";
import { CyclePhase } from "@prisma/client";

export const CreateCycleBodySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  phase: z.nativeEnum(CyclePhase),
  windowOpen: z.coerce.date(),
  windowClose: z.coerce.date(),
  isActive: z.boolean().default(false),
});

export const UpdateCycleBodySchema = z.object({
  windowOpen: z.coerce.date().optional(),
  windowClose: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCycleBody = z.infer<typeof CreateCycleBodySchema>;
export type UpdateCycleBody = z.infer<typeof UpdateCycleBodySchema>;
