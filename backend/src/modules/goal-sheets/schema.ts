import { z } from "zod";

export const SubmitSheetBodySchema = z.object({}).optional();

export const ReturnSheetBodySchema = z.object({
  returnReason: z
    .string()
    .min(10, { message: "Return reason must be at least 10 characters." })
    .trim(),
});

export const GoalSheetQuerySchema = z.object({
  cycleId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});

export type ReturnSheetBody = z.infer<typeof ReturnSheetBodySchema>;
export type GoalSheetQuery = z.infer<typeof GoalSheetQuerySchema>;
