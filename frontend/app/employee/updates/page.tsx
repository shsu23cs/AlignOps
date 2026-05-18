"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { api, AlignOpsApiError } from "@/lib/api";
import { useGoals, GoalFromAPI, AchievementFromAPI } from "@/lib/use-goals";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function QuarterlyUpdatesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const { sheet, activeCycle, activeCycles, loading, error, refreshSheet } = useGoals();
  const [activeQuarter, setActiveQuarter] = useState("Q1");
  
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local state for achievement inputs before saving
  const [inputs, setInputs] = useState<Record<string, { actualValue: string; actualDate: string; status: string }>>({});

  // Auth guard
  if (!authLoading && !user) { router.push("/login"); return null; }

  // Initialize inputs when sheet or activeQuarter changes
  useEffect(() => {
    if (sheet) {
      const newInputs: typeof inputs = {};
      sheet.goals.forEach(goal => {
        const ach = goal.achievements?.find(a => a.cyclePhase === activeQuarter);
        newInputs[goal.id] = {
          actualValue: ach?.actualValue !== null && ach?.actualValue !== undefined ? String(ach.actualValue) : "",
          actualDate: ach?.actualDate ? ach.actualDate.split("T")[0] : "",
          status: ach?.status || "NOT_STARTED",
        };
      });
      setInputs(newInputs);
    }
  }, [sheet, activeQuarter]);

  const handleInputChange = (goalId: string, field: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }));
  };

  const handleSaveAchievement = async (goalId: string, uomType: string) => {
    setActionError(null);
    setSuccessMessage(null);
    setActionLoading(prev => ({ ...prev, [goalId]: true }));
    
    try {
      const input = inputs[goalId];
      const isTimeline = uomType === "TIMELINE";
      
      const payload = {
        actualValue: !isTimeline && input.actualValue ? parseFloat(input.actualValue) : null,
        actualDate: isTimeline && input.actualDate ? new Date(input.actualDate).toISOString() : null,
        status: input.status,
      };

      await api.put(`/goals/${goalId}/achievements/${activeQuarter}`, payload);
      setSuccessMessage(`Successfully updated achievement for Q${activeQuarter.replace("Q", "")}.`);
      await refreshSheet();
    } catch (err) {
      if (err instanceof AlignOpsApiError) {
        setActionError(err.apiError.message);
      } else {
        setActionError("Failed to save achievement.");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [goalId]: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar role="employee" />
        <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: "var(--space-4)", animation: "pulse 1.5s ease infinite" }}>⏳</div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading updates…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar role="employee" />
        <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", maxWidth: 480, padding: "var(--space-8)" }}>
            <div style={{ fontSize: 48, marginBottom: "var(--space-4)" }}>⚠️</div>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>Something went wrong</h2>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </main>
      </div>
    );
  }

  const goals = sheet?.goals || [];
  const isSheetApproved = sheet?.locked;
  
  // Check if calendar window is open for the selected phase
  const isWindowOpen = !!activeCycles.find((c) => {
    if (c.phase !== activeQuarter) return false;
    const now = new Date();
    return now >= new Date(c.windowOpen) && now <= new Date(c.windowClose);
  });
  
  const canEdit = isSheetApproved && isWindowOpen;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="employee" />

      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          flex: 1,
          background: "var(--color-canvas)",
        }}
      >
        <Topbar title="Quarterly Updates" breadcrumbs={["Employee", "Updates"]} userName={user?.name || "Employee"} />

        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          {/* Page Header */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-3xl)",
                fontWeight: "var(--weight-bold)",
                color: "var(--color-text-primary)",
                letterSpacing: "var(--tracking-tight)",
                marginBottom: "var(--space-2)",
              }}
            >
              Achievement Tracking
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Log your quarterly achievements against planned targets. Real-time scoring calculates progress automatically.
            </p>
          </div>

          {!isSheetApproved && (
            <div style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <div>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-warning)" }}>
                  Goal sheet not approved yet
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Achievements can only be updated once your goal sheet has been approved and locked.
                </p>
              </div>
            </div>
          )}
          
          {isSheetApproved && !isWindowOpen && (
            <div style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: 24 }}>📅</span>
              <div>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-info)" }}>
                  Window Closed
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-info)" }}>
                  The submission window for {activeQuarter} is currently closed. You cannot edit achievements for this phase.
                </p>
              </div>
            </div>
          )}

          {/* Quarter Tabs */}
          <div style={{ marginBottom: "var(--space-6)", display: "flex", gap: "var(--space-2)", borderBottom: "2px solid var(--color-border-subtle)" }}>
            {QUARTERS.map((quarter) => (
              <button
                key={quarter}
                onClick={() => setActiveQuarter(quarter)}
                style={{
                  padding: "var(--space-3) var(--space-6)",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeQuarter === quarter ? "3px solid var(--color-accent-500)" : "3px solid transparent",
                  fontSize: "var(--text-base)",
                  fontWeight: activeQuarter === quarter ? "var(--weight-semibold)" : "var(--weight-medium)",
                  color: activeQuarter === quarter ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  marginBottom: "-2px",
                  transition: "all var(--duration-base) var(--ease-standard)",
                }}
              >
                {quarter}
              </button>
            ))}
          </div>

          {actionError && (
            <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-danger-bg)", borderLeft: "3px solid var(--color-danger)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
              ⚠ {actionError}
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-success-bg)", borderLeft: "3px solid var(--color-success)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-success)" }}>
              ✓ {successMessage}
            </div>
          )}

          {/* Goals List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {goals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-16)", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-subtle)" }}>
                <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-tertiary)" }}>No goals found in your sheet.</p>
              </div>
            ) : goals.map((goal) => {
              const ach = goal.achievements?.find(a => a.cyclePhase === activeQuarter);
              const input = inputs[goal.id] || { actualValue: "", actualDate: "", status: "NOT_STARTED" };
              const isTimeline = goal.uomType === "TIMELINE";

              let badgeStatus: any = "not-started";
              if (ach?.status === "ON_TRACK") badgeStatus = "on-track";
              else if (ach?.status === "COMPLETED") badgeStatus = "completed";

              const scoreValue = ach?.score ? Math.round(Number(ach.score) * 100) : null;

              return (
                <Card key={goal.id} title={goal.title} badge={<StatusBadge status={badgeStatus} />}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-6)" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Target</label>
                      <p style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
                        {isTimeline ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "—") : (goal.target ?? "—")}
                      </p>
                      
                      {ach?.score !== null && ach?.score !== undefined && (
                        <div style={{ display: "inline-block", background: "var(--color-surface-raised)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "block" }}>Calculated Score</span>
                          <span style={{ fontSize: "var(--text-xl)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-bold)", color: scoreValue && scoreValue >= 100 ? "var(--color-success)" : "var(--color-primary-600)" }}>
                            {scoreValue}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Actual Achievement</label>
                      {isTimeline ? (
                        <input
                          type="date"
                          value={input.actualDate}
                          onChange={(e) => handleInputChange(goal.id, "actualDate", e.target.value)}
                          disabled={!canEdit || actionLoading[goal.id]}
                          style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", background: !canEdit ? "var(--color-surface-sunken)" : "var(--color-surface)" }}
                        />
                      ) : (
                        <input
                          type="number"
                          step="any"
                          value={input.actualValue}
                          onChange={(e) => handleInputChange(goal.id, "actualValue", e.target.value)}
                          disabled={!canEdit || actionLoading[goal.id]}
                          style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", background: !canEdit ? "var(--color-surface-sunken)" : "var(--color-surface)" }}
                          placeholder="Enter actual value"
                        />
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Status</label>
                      <select
                        value={input.status}
                        onChange={(e) => handleInputChange(goal.id, "status", e.target.value)}
                        disabled={!canEdit || actionLoading[goal.id]}
                        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", background: !canEdit ? "var(--color-surface-sunken)" : "var(--color-surface)" }}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      
                      {canEdit && (
                        <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                          <Button 
                            onClick={() => handleSaveAchievement(goal.id, goal.uomType)}
                            disabled={actionLoading[goal.id]}
                            variant="secondary"
                          >
                            {actionLoading[goal.id] ? "Saving..." : "Save Update"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
