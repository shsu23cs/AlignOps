"use client";
/**
 * Hook that manages all Goal Sheet + Goals API calls for the employee view.
 * Handles 422 validation errors with per-field details from the backend.
 */
import { useState, useEffect, useCallback } from "react";
import { api, AlignOpsApiError } from "@/lib/api";

export interface GoalFromAPI {
  id: string;
  goalSheetId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO";
  target: string | null;
  targetDate: string | null;
  weightage: string;
  isShared: boolean;
  sharedFromId: string | null;
  status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED";
  achievements: AchievementFromAPI[];
  createdAt: string;
}

export interface AchievementFromAPI {
  id: string;
  goalId: string;
  cyclePhase: string;
  actualValue: number | null;
  actualDate: string | null;
  status: "NOT_STARTED" | "ON_TRACK" | "COMPLETED";
  score: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSheetFromAPI {
  id: string;
  employeeId: string;
  cycleId: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "RETURNED";
  locked: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  returnReason: string | null;
  approvedBy: { id: string; name: string } | null;
  goals: GoalFromAPI[];
  cycle: { id: string; year: number; phase: string; windowOpen: string; windowClose: string; isActive: boolean };
  employee: { id: string; name: string; email: string; department: string };
}

export interface CycleFromAPI {
  id: string;
  year: number;
  phase: string;
  windowOpen: string;
  windowClose: string;
  isActive: boolean;
}

export interface NewGoalPayload {
  thrustArea: string;
  title: string;
  description: string;
  uomType: string;
  target?: number | null;
  targetDate?: string | null;
  weightage: number;
}

export function useGoals() {
  const [sheet, setSheet] = useState<GoalSheetFromAPI | null>(null);
  const [activeCycles, setActiveCycles] = useState<CycleFromAPI[]>([]);
  const [activeCycle, setActiveCycle] = useState<CycleFromAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ field?: string; message: string }[]>([]);
  /** Per-field error map extracted from 422 responses, e.g. { weightage: "Minimum 10%..." } */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearActionError = useCallback(() => {
    setActionError(null);
    setValidationErrors([]);
    setFieldErrors({});
  }, []);

  /** Shared handler for catching API errors — properly unpacks 422 validation errors */
  function handleApiError(err: unknown, fallbackMsg: string) {
    if (err instanceof AlignOpsApiError) {
      setActionError(err.apiError.message);
      setValidationErrors(err.apiError.details || []);
      setFieldErrors(err.fieldErrors);
    } else {
      setActionError(fallbackMsg);
    }
  }

  // Load active GOAL_SETTING cycle, then fetch the employee's sheet
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cycles = await api.get<CycleFromAPI[]>("/cycles/active");
      setActiveCycles(cycles);
      const goalSettingCycle = cycles.find((c) => c.phase === "GOAL_SETTING") || cycles[0];
      if (!goalSettingCycle) {
        setError("No active cycle found. Please contact your administrator.");
        setLoading(false);
        return;
      }
      setActiveCycle(goalSettingCycle);
      const data = await api.get<GoalSheetFromAPI>(`/goal-sheets/mine?cycleId=${goalSettingCycle.id}`);
      setSheet(data);
    } catch (err) {
      if (err instanceof AlignOpsApiError) setError(err.apiError.message);
      else setError("Failed to load goals. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload just the sheet (after mutations)
  const refreshSheet = useCallback(async () => {
    if (!activeCycle) return;
    try {
      const data = await api.get<GoalSheetFromAPI>(`/goal-sheets/mine?cycleId=${activeCycle.id}`);
      setSheet(data);
    } catch { /* silent — stale data is acceptable briefly */ }
  }, [activeCycle]);

  // Add a new goal
  const addGoal = useCallback(async (payload: NewGoalPayload) => {
    if (!sheet) return;
    setActionLoading(true);
    clearActionError();
    try {
      await api.post(`/goal-sheets/${sheet.id}/goals`, payload);
      await refreshSheet();
    } catch (err) {
      handleApiError(err, "Failed to add goal.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [sheet, refreshSheet, clearActionError]);

  // Update a goal (e.g. weightage change)
  const updateGoal = useCallback(async (goalId: string, payload: Partial<NewGoalPayload>) => {
    setActionLoading(true);
    clearActionError();
    try {
      await api.patch(`/goals/${goalId}`, payload);
      await refreshSheet();
    } catch (err) {
      handleApiError(err, "Failed to update goal.");
    } finally {
      setActionLoading(false);
    }
  }, [refreshSheet, clearActionError]);

  // Delete a goal
  const deleteGoal = useCallback(async (goalId: string) => {
    setActionLoading(true);
    clearActionError();
    try {
      await api.delete(`/goals/${goalId}`);
      await refreshSheet();
    } catch (err) {
      handleApiError(err, "Failed to delete goal.");
    } finally {
      setActionLoading(false);
    }
  }, [refreshSheet, clearActionError]);

  // Submit sheet for approval
  const submitSheet = useCallback(async () => {
    if (!sheet) return;
    setActionLoading(true);
    clearActionError();
    try {
      await api.post(`/goal-sheets/${sheet.id}/submit`);
      await refreshSheet();
    } catch (err) {
      handleApiError(err, "Failed to submit goal sheet.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [sheet, refreshSheet, clearActionError]);

  return {
    sheet, activeCycle, activeCycles, loading, error, actionError, actionLoading,
    validationErrors, fieldErrors,
    addGoal, updateGoal, deleteGoal, submitSheet, clearActionError, refreshSheet,
  };
}
