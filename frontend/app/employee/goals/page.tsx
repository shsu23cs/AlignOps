"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import AddGoalModal from "@/components/AddGoalModal";
import { useAuth } from "@/lib/auth-context";
import { useGoals, GoalFromAPI } from "@/lib/use-goals";

const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric (Higher is Better)",
  NUMERIC_MAX: "Numeric (Lower is Better)",
  TIMELINE: "Timeline",
  ZERO: "Zero-based",
};

function statusToBadge(s: string): "not-started" | "on-track" | "completed" {
  if (s === "ON_TRACK") return "on-track";
  if (s === "COMPLETED") return "completed";
  return "not-started";
}

export default function EmployeeGoalsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    sheet, activeCycle, loading, error, actionError, actionLoading,
    validationErrors, addGoal, updateGoal, deleteGoal, submitSheet, clearActionError,
  } = useGoals();

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Auth guard
  if (!authLoading && !user) { router.push("/login"); return null; }
  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar role="employee" />
        <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: "var(--space-4)", animation: "pulse 1.5s ease infinite" }}>⏳</div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading your goals…</p>
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
  const isLocked = sheet?.locked || false;
  const isDraft = sheet?.status === "DRAFT" || sheet?.status === "RETURNED";
  const isPending = sheet?.status === "PENDING_APPROVAL";
  const isApproved = sheet?.status === "APPROVED";
  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
  const remainingWeightage = 100 - totalWeightage;
  const canSubmit = goals.length > 0 && goals.length <= 8 && Math.abs(totalWeightage - 100) < 0.01 && goals.every((g) => Number(g.weightage) >= 10);
  const cycleYear = activeCycle ? `FY ${activeCycle.year}-${(activeCycle.year + 1).toString().slice(2)}` : "";

  // Calendar Window Check
  const isWindowOpen = activeCycle ? (new Date() >= new Date(activeCycle.windowOpen) && new Date() <= new Date(activeCycle.windowClose)) : false;

  async function handleWeightageBlur(goal: GoalFromAPI, newValue: string) {
    const w = parseInt(newValue, 10);
    if (isNaN(w) || w === Number(goal.weightage)) return;
    await updateGoal(goal.id, { weightage: w });
  }

  async function handleDelete(goalId: string) {
    await deleteGoal(goalId);
    setConfirmDelete(null);
  }

  async function handleSubmit() {
    clearActionError();
    try { await submitSheet(); } catch { /* errors shown via hook state */ }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="employee" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="My Goals" breadcrumbs={["Employee", "Goals"]} userName={user?.name || "Employee"} />

        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>

          {/* Return reason banner */}
          {sheet?.status === "RETURNED" && sheet.returnReason && (
            <div style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", marginBottom: "var(--space-6)", display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
              <span style={{ fontSize: 24 }}>↩️</span>
              <div>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-warning)", marginBottom: 4 }}>Goals returned for revision</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Manager&apos;s feedback: {sheet.returnReason}</p>
              </div>
            </div>
          )}

          {/* Locked banner */}
          {isLocked && (
            <div style={{ background: "var(--color-primary-50)", border: "1px solid var(--color-primary-200)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <div>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-primary-600)", marginBottom: 4 }}>
                  Goals approved{sheet?.approvedBy ? ` by ${sheet.approvedBy.name}` : ""} and locked
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary-600)" }}>
                  {sheet?.approvedAt ? `Approved: ${new Date(sheet.approvedAt).toLocaleDateString()}` : ""} · Changes require Admin unlock
                </p>
              </div>
            </div>
          )}

          {/* Pending banner */}
          {isPending && (
            <div style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: 24 }}>⏳</span>
              <div>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-info)" }}>
                  Goal sheet submitted — awaiting manager approval
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {sheet?.submittedAt ? `Submitted on ${new Date(sheet.submittedAt).toLocaleDateString()}` : ""}
                </p>
              </div>
            </div>
          )}
          
          {/* Window Closed banner */}
          {isDraft && !isWindowOpen && (
            <div style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: 24 }}>📅</span>
              <div>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-info)" }}>
                  Window Closed
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-info)" }}>
                  The goal setting window is currently closed. You cannot add or edit goals at this time.
                </p>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
                Goal Sheet — {cycleYear}
              </h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
                {isDraft ? "Define your goals for the current cycle. Total weightage must equal 100%." : isApproved ? "Your goals are approved and locked." : isPending ? "Waiting for manager review." : ""}
              </p>
            </div>
            {isDraft && isWindowOpen && (
              <Button onClick={() => setShowAddModal(true)} disabled={goals.length >= 8 || actionLoading}>
                + Add Goal
              </Button>
            )}
          </div>

          {/* Server-side action errors */}
          {actionError && (
            <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--color-danger-bg)", borderLeft: "3px solid var(--color-danger)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-danger)", marginBottom: validationErrors.length ? 8 : 0 }}>⚠ {actionError}</p>
              {validationErrors.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
                  {validationErrors.map((v, i) => <li key={i}>{v.message}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Goals List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            {goals.map((goal, index) => (
              <Card key={goal.id} title={`Goal ${index + 1}: ${goal.title}`} badge={<StatusBadge status={statusToBadge(goal.status)} />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Description</label>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>{goal.description}</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Thrust Area</label>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>{goal.thrustArea}</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Unit of Measurement</label>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>{UOM_LABELS[goal.uomType] || goal.uomType}</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Target</label>
                    <p style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
                      {goal.uomType === "TIMELINE" ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "—") : (goal.target ?? "—")}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>Weightage</label>
                    {isDraft && !goal.isShared && isWindowOpen ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <input
                          type="number" min={10} max={100}
                          defaultValue={Number(goal.weightage)}
                          disabled={actionLoading}
                          onBlur={(e) => handleWeightageBlur(goal, e.target.value)}
                          style={{ width: 80, padding: "8px 12px", border: "1.5px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", textAlign: "right", background: "var(--color-surface)" }}
                        />
                        <span style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>%</span>
                      </div>
                    ) : (
                      <p style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>{Number(goal.weightage)}%</p>
                    )}
                    {Number(goal.weightage) < 10 && (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>Minimum 10% required</p>
                    )}
                  </div>
                  {goal.isShared && (
                    <div>
                      <span style={{ display: "inline-block", padding: "2px 8px", fontSize: "var(--text-xs)", background: "var(--color-primary-50)", color: "var(--color-primary-600)", borderRadius: "var(--radius-full)", fontWeight: "var(--weight-semibold)" }}>Shared Goal</span>
                    </div>
                  )}
                </div>
                {/* Delete button for draft goals */}
                {isDraft && !goal.isShared && isWindowOpen && (
                  <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                    {confirmDelete === goal.id ? (
                      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>Delete this goal?</span>
                        <Button variant="secondary" onClick={() => setConfirmDelete(null)}>No</Button>
                        <button onClick={() => handleDelete(goal.id)} disabled={actionLoading} style={{ padding: "6px 16px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", cursor: "pointer" }}>Yes, Delete</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(goal.id)} style={{ padding: "6px 16px", background: "transparent", color: "var(--color-danger)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", cursor: "pointer" }}>🗑 Remove</button>
                    )}
                  </div>
                )}
              </Card>
            ))}

            {goals.length === 0 && (
              <div style={{ textAlign: "center", padding: "var(--space-16)", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-subtle)" }}>
                <div style={{ fontSize: 48, marginBottom: "var(--space-4)", opacity: 0.3 }}>🎯</div>
                <h3 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>No goals yet for this cycle</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-4)" }}>
                  Create goals during the active Goal Setting window.
                </p>
                {isDraft && isWindowOpen && <Button onClick={() => setShowAddModal(true)}>Create Your First Goal</Button>}
              </div>
            )}
          </div>

          {/* Weightage Totalizer */}
          {goals.length > 0 && isDraft && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <div style={{ height: 12, background: "var(--color-surface-sunken)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(totalWeightage, 100)}%`, background: totalWeightage === 100 ? "var(--color-success)" : totalWeightage > 100 ? "var(--color-danger)" : "var(--color-accent-500)", transition: "all var(--duration-slow) var(--ease-standard)" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "var(--text-2xl)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-bold)", color: totalWeightage === 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>{totalWeightage}%</span>
                  <span style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}> / 100%</span>
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Remaining: <strong>{remainingWeightage}%</strong> · {goals.length} / 8 goals
                </div>
              </div>
              {totalWeightage !== 100 && (
                <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3)", background: "var(--color-warning-bg)", borderLeft: "3px solid var(--color-warning)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-warning)" }}>
                  ⚠ Total weightage is {totalWeightage}% — must equal exactly 100%
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isDraft && goals.length > 0 && isWindowOpen && (
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <Button onClick={handleSubmit} disabled={!canSubmit || actionLoading}>
                {actionLoading ? "Submitting…" : "Submit for Approval"}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Goal Modal */}
      {showAddModal && (
        <AddGoalModal
          onAdd={addGoal}
          onClose={() => setShowAddModal(false)}
          disabled={actionLoading}
        />
      )}
    </div>
  );
}
