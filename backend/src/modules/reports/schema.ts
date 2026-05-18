import { z } from "zod";

export const CompletionReportQuerySchema = z.object({
  cycleId: z.string().uuid().optional(),
  department: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AchievementReportQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  department: z.string().optional(),
  phase: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
  thrustArea: z.string().optional(),
  cycleId: z.string().uuid().optional(),
  format: z.enum(["csv", "xlsx"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
});

export type CompletionReportQuery = z.infer<typeof CompletionReportQuerySchema>;
export type AchievementReportQuery = z.infer<typeof AchievementReportQuerySchema>;
