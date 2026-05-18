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
import type { GoalSheetFromAPI, CycleFromAPI, GoalFromAPI } from "@/lib/use-goals";

const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric ↑",
  NUMERIC_MAX: "Numeric ↓",
  TIMELINE: "Timeline",
  ZERO: "Zero-based",
};

type SheetStatusFilter = "all" | "PENDING_APPROVAL" | "APPROVED" | "RETURNED";

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [sheets, setSheets] = useState<GoalSheetFromAPI[]>([]);
  const [cycles, setCycles] = useState<CycleFromAPI[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SheetStatusFilter>("all");

  // Expanded sheet for review
  const [expandedSheetId, setExpandedSheetId] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field?: string; message: string }[]>([]);

  // Return modal
  const [returnSheetId, setReturnSheetId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  // Inline editing
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editWeightage, setEditWeightage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeCycles = await api.get<CycleFromAPI[]>("/cycles/active");
      setCycles(activeCycles);
      const cycleId = selectedCycleId || activeCycles[0]?.id || "";
      if (!selectedCycleId && cycleId) setSelectedCycleId(cycleId);

      const teamSheets = await api.get<GoalSheetFromAPI[]>(
        `/goal-sheets${cycleId ? `?cycleId=${cycleId}` : ""}`
      );
      setSheets(teamSheets);
    } catch (err) {
      if (err instanceof AlignOpsApiError) setError(err.apiError.message);
      else setError("Failed to load team goal sheets.");
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  // Auth guard
  if (!authLoading && !user) { router.push("/login"); return null; }
  if (!authLoading && user?.role !== "MANAGER" && user?.role !== "ADMIN") {
    router.push("/login"); return null;
  }

  // Filter sheets
  const filteredSheets = statusFilter === "all"
    ? sheets
    : sheets.filter((s) => s.status === statusFilter);

  const pendingCount = sheets.filter((s) => s.status === "PENDING_APPROVAL").length;
  const approvedCount = sheets.filter((s) => s.status === "APPROVED").length;
  const returnedCount = sheets.filter((s) => s.status === "RETURNED").length;

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function handleApprove(sheetId: string) {
    setActionLoading(true);
    setActionError(null);
    setValidationErrors([]);
    try {
      await api.post(`/goal-sheets/${sheetId}/approve`);
      await loadData();
      setExpandedSheetId(null);
    } catch (err) {
      if (err instanceof AlignOpsApiError) {
        setActionError(err.apiError.message);
        setValidationErrors(err.apiError.details || []);
      } else setActionError("Failed to approve sheet.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn() {
    if (!returnSheetId) return;
    if (returnReason.trim().length < 10) {
      setActionError("Return reason must be at least 10 characters.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setValidationErrors([]);
    try {
      await api.post(`/goal-sheets/${returnSheetId}/return`, {
        returnReason: returnReason.trim(),
      });
      setReturnSheetId(null);
      setReturnReason("");
      await loadData();
      setExpandedSheetId(null);
    } catch (err) {
      if (err instanceof AlignOpsApiError) {
        setActionError(err.apiError.message);
        setValidationErrors(err.apiError.details || []);
      } else setActionError("Failed to return sheet.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleInlineWeightageUpdate(goalId: string) {
    const w = parseInt(editWeightage, 10);
    if (isNaN(w) || w < 10 || w > 100) {
      setActionError("Weightage must be between 10 and 100.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/goals/${goalId}`, { weightage: w });
      await loadData();
      setEditingGoalId(null);
    } catch (err) {
      if (err instanceof AlignOpsApiError) {
        setActionError(err.apiError.message);
        setValidationErrors(err.apiError.details || []);
      } else setActionError("Failed to update goal.");
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar role="manager" />
        <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: "var(--space-4)", animation: "pulse 1.5s ease infinite" }}>⏳</div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading team goal sheets…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar role="manager" />
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

  const expandedSheet = expandedSheetId ? sheets.find((s) => s.id === expandedSheetId) : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="manager" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Goal Approvals" breadcrumbs={["Manager", "Approvals"]} userName={user?.name || "Manager"} />

        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
              Team Goal Sheet Approvals
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Review, adjust weightages, and approve or return team member goal sheets.
            </p>
          </div>

          {/* KPI Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            <div onClick={() => setStatusFilter("PENDING_APPROVAL")} style={{ cursor: "pointer", padding: "var(--space-5)", background: statusFilter === "PENDING_APPROVAL" ? "var(--color-warning-bg)" : "var(--color-surface)", border: `1.5px solid ${statusFilter === "PENDING_APPROVAL" ? "var(--color-warning)" : "var(--color-border-default)"}`, borderRadius: "var(--radius-lg)", textAlign: "center", transition: "all var(--duration-base) var(--ease-standard)" }}>
              <div style={{ fontSize: "var(--text-3xl)", fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", color: "var(--color-warning)" }}>{pendingCount}</div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Pending</p>
            </div>
            <div onClick={() => setStatusFilter("APPROVED")} style={{ cursor: "pointer", padding: "var(--space-5)", background: statusFilter === "APPROVED" ? "var(--color-success-bg)" : "var(--color-surface)", border: `1.5px solid ${statusFilter === "APPROVED" ? "var(--color-success)" : "var(--color-border-default)"}`, borderRadius: "var(--radius-lg)", textAlign: "center", transition: "all var(--duration-base) var(--ease-standard)" }}>
              <div style={{ fontSize: "var(--text-3xl)", fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", color: "var(--color-success)" }}>{approvedCount}</div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>Approved</p>
            </div>
            <div onClick={() => setStatusFilter("all")} style={{ cursor: "pointer", padding: "var(--space-5)", background: statusFilter === "all" ? "var(--color-primary-50)" : "var(--color-surface)", border: `1.5px solid ${statusFilter === "all" ? "var(--color-primary-500)" : "var(--color-border-default)"}`, borderRadius: "var(--radius-lg)", textAlign: "center", transition: "all var(--duration-base) var(--ease-standard)" }}>
              <div style={{ fontSize: "var(--text-3xl)", fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", color: "var(--color-primary-500)" }}>{sheets.length}</div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>All Sheets</p>
            </div>
          </div>

          {/* Action Errors */}
          {actionError && (
            <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", background: "var(--color-danger-bg)", borderLeft: "3px solid var(--color-danger)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-danger)", marginBottom: validationErrors.length ? 8 : 0 }}>⚠ {actionError}</p>
              {validationErrors.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
                  {validationErrors.map((v, i) => <li key={i}>{v.field ? `${v.field}: ` : ""}{v.message}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Sheets List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {filteredSheets.length === 0 && (
              <div style={{ textAlign: "center", padding: "var(--space-16)", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-subtle)" }}>
                <div style={{ fontSize: 48, marginBottom: "var(--space-4)", opacity: 0.3 }}>📋</div>
                <h3 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)" }}>
                  No goal sheets {statusFilter !== "all" ? `with status "${statusFilter.replace("_", " ").toLowerCase()}"` : "found"}
                </h3>
              </div>
            )}

            {filteredSheets.map((sheet) => {
              const totalWeightage = sheet.goals.reduce((s, g) => s + Number(g.weightage), 0);
              const isExpanded = expandedSheetId === sheet.id;
              const sheetBadge = sheet.status === "PENDING_APPROVAL" ? "pending" : sheet.status === "APPROVED" ? "approved" : sheet.status === "RETURNED" ? "returned" : "not-started";

              return (
                <Card key={sheet.id} title={sheet.employee.name} subtitle={`${sheet.employee.email} · ${sheet.employee.department}`} badge={<StatusBadge status={sheetBadge} />}>
                  {/* Summary Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isExpanded ? "var(--space-4)" : 0 }}>
                    <div style={{ display: "flex", gap: "var(--space-6)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      <span><strong>{sheet.goals.length}</strong> Goals</span>
                      <span>Total: <strong style={{ color: totalWeightage === 100 ? "var(--color-success)" : "var(--color-danger)", fontFamily: "var(--font-mono)" }}>{totalWeightage}%</strong></span>
                      {sheet.submittedAt && <span>Submitted: {new Date(sheet.submittedAt).toLocaleDateString()}</span>}
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button variant="ghost" onClick={() => setExpandedSheetId(isExpanded ? null : sheet.id)}>
                        {isExpanded ? "▲ Collapse" : "▼ Review"}
                      </Button>
                      {sheet.status === "PENDING_APPROVAL" && (
                        <>
                          <Button onClick={() => handleApprove(sheet.id)} disabled={actionLoading}>✓ Approve</Button>
                          <Button variant="destructive" onClick={() => { setReturnSheetId(sheet.id); setReturnReason(""); setActionError(null); }} disabled={actionLoading}>↩ Return</Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Goal Details */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-4)" }}>
                      {sheet.goals.length === 0 ? (
                        <p style={{ color: "var(--color-text-tertiary)", textAlign: "center", padding: "var(--space-4)" }}>No goals defined.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                          {sheet.goals.map((goal: GoalFromAPI, idx: number) => (
                            <div key={goal.id} style={{ padding: "var(--space-4)", background: "var(--color-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                                <div>
                                  <h4 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: 4 }}>
                                    {idx + 1}. {goal.title}
                                    {goal.isShared && (
                                      <span style={{ marginLeft: 8, padding: "2px 8px", fontSize: "var(--text-xs)", background: "var(--color-primary-50)", color: "var(--color-primary-600)", borderRadius: "var(--radius-full)", fontWeight: "var(--weight-semibold)" }}>Shared</span>
                                    )}
                                  </h4>
                                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{goal.description}</p>
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--space-4)", fontSize: "var(--text-sm)" }}>
                                <div>
                                  <span style={{ color: "var(--color-text-tertiary)" }}>Thrust Area</span>
                                  <p style={{ fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>{goal.thrustArea}</p>
                                </div>
                                <div>
                                  <span style={{ color: "var(--color-text-tertiary)" }}>UoM</span>
                                  <p style={{ fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>{UOM_LABELS[goal.uomType] || goal.uomType}</p>
                                </div>
                                <div>
                                  <span style={{ color: "var(--color-text-tertiary)" }}>Target</span>
                                  <p style={{ fontWeight: "var(--weight-medium)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                                    {goal.uomType === "TIMELINE" ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "—") : (goal.target ?? "—")}
                                  </p>
                                </div>
                                <div>
                                  <span style={{ color: "var(--color-text-tertiary)" }}>Weightage</span>
                                  {editingGoalId === goal.id && sheet.status === "PENDING_APPROVAL" ? (
                                    <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
                                      <input
                                        type="number" min={10} max={100}
                                        value={editWeightage}
                                        onChange={(e) => setEditWeightage(e.target.value)}
                                        style={{ width: 70, padding: "4px 8px", border: "1.5px solid var(--color-primary-500)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", textAlign: "right" }}
                                      />
                                      <span style={{ fontSize: "var(--text-sm)" }}>%</span>
                                      <button onClick={() => handleInlineWeightageUpdate(goal.id)} disabled={actionLoading} style={{ padding: "2px 8px", background: "var(--color-primary-500)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "var(--text-xs)", cursor: "pointer" }}>✓</button>
                                      <button onClick={() => setEditingGoalId(null)} style={{ padding: "2px 8px", background: "var(--color-surface-sunken)", color: "var(--color-text-secondary)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "var(--text-xs)", cursor: "pointer" }}>✕</button>
                                    </div>
                                  ) : (
                                    <p
                                      style={{ fontWeight: "var(--weight-medium)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", cursor: sheet.status === "PENDING_APPROVAL" ? "pointer" : "default" }}
                                      onClick={() => {
                                        if (sheet.status === "PENDING_APPROVAL") {
                                          setEditingGoalId(goal.id);
                                          setEditWeightage(String(Number(goal.weightage)));
                                        }
                                      }}
                                      title={sheet.status === "PENDING_APPROVAL" ? "Click to edit weightage" : undefined}
                                    >
                                      {Number(goal.weightage)}%
                                      {sheet.status === "PENDING_APPROVAL" && <span style={{ marginLeft: 4, fontSize: "var(--text-xs)", color: "var(--color-primary-400)" }}>✎</span>}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Weightage Total */}
                      <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-surface-sunken)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Total Weightage</span>
                        <span style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-bold)", color: totalWeightage === 100 ? "var(--color-success)" : "var(--color-danger)" }}>{totalWeightage}%</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* Return Reason Modal */}
      {returnSheetId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setReturnSheetId(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", padding: "var(--space-8)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
              Return Goal Sheet
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
              Provide a reason for returning this goal sheet. The employee will see this feedback and can make revisions.
            </p>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: 6 }}>Return Reason</label>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Please adjust weightage for Goal 3 from 5% to at least 10%. Also add description for Goal 2."
              style={{
                width: "100%", minHeight: 100, padding: "10px 14px",
                border: `1.5px solid ${returnReason.length > 0 && returnReason.length < 10 ? "var(--color-danger)" : "var(--color-border-strong)"}`,
                borderRadius: "var(--radius-md)", fontSize: "var(--text-base)",
                background: "var(--color-surface)", color: "var(--color-text-primary)",
                resize: "vertical",
              }}
            />
            <p style={{ fontSize: "var(--text-xs)", color: returnReason.length > 0 && returnReason.length < 10 ? "var(--color-danger)" : "var(--color-text-tertiary)", marginTop: 4, marginBottom: "var(--space-4)" }}>
              {returnReason.length}/10 characters minimum
            </p>
            {actionError && (
              <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-danger-bg)", borderLeft: "3px solid var(--color-danger)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
                ⚠ {actionError}
              </div>
            )}
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setReturnSheetId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReturn} disabled={actionLoading || returnReason.trim().length < 10}>
                {actionLoading ? "Returning…" : "Return Sheet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
