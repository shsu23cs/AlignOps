import { z } from "zod";
import { CyclePhase } from "@prisma/client";

export const CheckinCommentBodySchema = z.object({
  cyclePhase: z.nativeEnum(CyclePhase).refine(
    (v) => v !== CyclePhase.GOAL_SETTING,
    { message: "Check-in comments are for Q1-Q4 phases only." }
  ),
  comment: z.string().min(1, { message: "Comment cannot be empty." }).trim(),
});

export type CheckinCommentBody = z.infer<typeof CheckinCommentBodySchema>;
