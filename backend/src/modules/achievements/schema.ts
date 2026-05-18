import { z } from "zod";
import { CyclePhase, AchievementStatus } from "@prisma/client";

export const UpsertAchievementBodySchema = z.object({
  actualValue: z.coerce.number().nullable().optional(),
  actualDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(AchievementStatus).default(AchievementStatus.ON_TRACK),
});

export type UpsertAchievementBody = z.infer<typeof UpsertAchievementBodySchema>;
