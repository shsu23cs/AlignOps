import { z } from "zod";
import { UomType, GoalStatus } from "@prisma/client";

export const GoalBodySchema = z.object({
  thrustArea: z.string().min(1).trim(),
  title: z.string().min(1).trim(),
  description: z.string().min(1).trim(),
  uomType: z.nativeEnum(UomType),
  target: z.coerce.number().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
  weightage: z.coerce.number().min(10, { message: "Minimum weightage is 10%." }).max(100),
  status: z.nativeEnum(GoalStatus).default(GoalStatus.NOT_STARTED),
});

export const UpdateGoalBodySchema = GoalBodySchema.partial().extend({
  weightage: z.coerce.number().min(10).max(100).optional(),
});

export const ShareGoalBodySchema = z.object({
  sourceGoalId: z.string().uuid(),
  targetEmployeeIds: z
    .array(z.string().uuid())
    .min(1, { message: "At least one target employee is required." }),
  weightage: z.coerce.number().min(10).max(100),
});

export type GoalBody = z.infer<typeof GoalBodySchema>;
export type UpdateGoalBody = z.infer<typeof UpdateGoalBodySchema>;
export type ShareGoalBody = z.infer<typeof ShareGoalBodySchema>;
