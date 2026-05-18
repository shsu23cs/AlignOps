"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { api, AlignOpsApiError } from "@/lib/api";

const UOM_OPTIONS = [
  { value: "NUMERIC_MIN", label: "Numeric (Higher is Better)" },
  { value: "NUMERIC_MAX", label: "Numeric (Lower is Better)" },
  { value: "TIMELINE",    label: "Timeline (Date-based)" },
  { value: "ZERO",        label: "Zero-based" },
];

export default function SharedGoalsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [directReports, setDirectReports] = useState<{ id: string; name: string; department: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [thrustArea, setThrustArea] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uomType, setUomType] = useState("NUMERIC_MIN");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [weightage, setWeightage] = useState("10");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isTimeline = uomType === "TIMELINE";

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const reports = await api.get<{ id: string; name: string; department: string }[]>(`/users/${user.id}/direct-reports`);
      setDirectReports(reports);
      // Select all by default
      setSelectedReports(reports.map(r => r.id));
    } catch (err) {
      setError("Failed to load direct reports.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  // Auth guard
  if (!authLoading && !user) { router.push("/login"); return null; }
  if (!authLoading && user?.role !== "MANAGER" && user?.role !== "ADMIN") {
    router.push("/login"); return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    if (selectedReports.length === 0) {
      setActionError("Please select at least one direct report.");
      return;
    }

    const w = parseInt(weightage, 10);
    if (isNaN(w) || w < 10 || w > 100) {
      setActionError("Weightage must be between 10 and 100.");
      return;
    }

    setActionLoading(true);

    try {
      // Step 1: Manager must create the goal on their own sheet or a dummy sheet?
      // Wait, the backend requires a `sourceGoalId`. The manager doesn't have a goal sheet.
      // Looking at the backend `ShareGoalBodySchema`, it needs a `sourceGoalId`.
      // Where does the manager create the source goal? 
      // Let's check `manager/dashboard` or `manager/shared-goals` if they can create goals.
      // The instructions say "push shared goals to team members", maybe the manager has a goal sheet, or they create one?
      // Let's create a goal sheet for the manager, then create the goal, then share it.
      
      const cycles = await api.get<{id: string, phase: string}[]>("/cycles/active");
      const cycleId = cycles[0]?.id;
      if (!cycleId) throw new Error("No active cycle");

      // Get or create manager's goal sheet
      let sheet: any;
      try {
        sheet = await api.get(`/goal-sheets/mine?cycleId=${cycleId}`);
      } catch (e: any) {
        // If not found, create one? /goal-sheets/mine auto-creates if missing!
        sheet = await api.get(`/goal-sheets/mine?cycleId=${cycleId}`);
      }

      // Add the source goal
      const newGoal = await api.post<any>(`/goal-sheets/${sheet.id}/goals`, {
        thrustArea,
        title,
        description,
        uomType,
        target: isTimeline ? null : (target ? parseFloat(target) : null),
        targetDate: isTimeline && targetDate ? targetDate : null,
        weightage: w,
      });

      // Now share it
      const result = await api.post<{shared: number}>(`/goals/share`, {
        sourceGoalId: newGoal.id,
        targetEmployeeIds: selectedReports,
        weightage: w,
      });

      setSuccessMessage(`Successfully pushed shared goal to ${result.shared} team member(s).`);
      
      // Reset form
      setThrustArea("");
      setTitle("");
      setDescription("");
      setTarget("");
      setTargetDate("");
      setWeightage("10");

    } catch (err) {
      if (err instanceof AlignOpsApiError) {
        if (err.isValidationError) setFieldErrors(err.fieldErrors);
        setActionError(err.apiError.message);
      } else {
        setActionError(err instanceof Error ? err.message : "Failed to push shared goal.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  function toggleReport(id: string) {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(rId => rId !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1.5px solid var(--color-border-strong)",
    borderRadius: "var(--radius-md)", fontSize: "var(--text-base)",
    background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: "6px", fontSize: "var(--text-sm)",
    fontWeight: "var(--weight-semibold)" as any, color: "var(--color-text-primary)",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="manager" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Shared Goals" breadcrumbs={["Manager", "Shared Goals"]} userName={user?.name || "Manager"} />
        
        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          
          <div style={{ marginBottom: "var(--space-6)" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
              Push Shared Goals
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Create a common organizational goal and instantly push it to your direct reports' goal sheets.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading...</div>
          ) : error ? (
            <div style={{ color: "var(--color-danger)" }}>{error}</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
              <Card title="Create Goal Template">
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div>
                      <label style={labelStyle}>Thrust Area</label>
                      <input style={{ ...inputStyle, borderColor: fieldErrors["thrustArea"] ? "var(--color-danger)" : "var(--color-border-strong)" }} value={thrustArea} onChange={(e) => setThrustArea(e.target.value)} placeholder="e.g. Revenue Growth" />
                      {fieldErrors["thrustArea"] && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors["thrustArea"]}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Goal Title</label>
                      <input style={{ ...inputStyle, borderColor: fieldErrors["title"] ? "var(--color-danger)" : "var(--color-border-strong)" }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Increase Sales Revenue" />
                      {fieldErrors["title"] && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors["title"]}</p>}
                    </div>
                  </div>
                  <div style={{ marginBottom: "var(--space-4)" }}>
                    <label style={labelStyle}>Description</label>
                    <textarea style={{ ...inputStyle, borderColor: fieldErrors["description"] ? "var(--color-danger)" : "var(--color-border-strong)", minHeight: 80, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the goal..." />
                    {fieldErrors["description"] && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors["description"]}</p>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div>
                      <label style={labelStyle}>Unit of Measurement</label>
                      <select style={{ ...inputStyle, borderColor: fieldErrors["uomType"] ? "var(--color-danger)" : "var(--color-border-strong)" }} value={uomType} onChange={(e) => setUomType(e.target.value)}>
                        {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      {isTimeline ? (
                        <>
                          <label style={labelStyle}>Target Date</label>
                          <input type="date" style={{ ...inputStyle, borderColor: fieldErrors["targetDate"] ? "var(--color-danger)" : "var(--color-border-strong)" }} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                          {fieldErrors["targetDate"] && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors["targetDate"]}</p>}
                        </>
                      ) : (
                        <>
                          <label style={labelStyle}>Target Value</label>
                          <input type="number" step="any" style={{ ...inputStyle, borderColor: fieldErrors["target"] ? "var(--color-danger)" : "var(--color-border-strong)" }} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 100" />
                          {fieldErrors["target"] && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors["target"]}</p>}
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: "var(--space-6)" }}>
                    <label style={labelStyle}>Weightage (%)</label>
                    <input type="number" min={10} max={100} style={{ ...inputStyle, width: 120, borderColor: fieldErrors["weightage"] ? "var(--color-danger)" : "var(--color-border-strong)" }} value={weightage} onChange={(e) => setWeightage(e.target.value)} />
                    {fieldErrors["weightage"] && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4 }}>{fieldErrors["weightage"]}</p>}
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

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button type="submit" disabled={actionLoading || directReports.length === 0}>
                      {actionLoading ? "Pushing Goal..." : "Push to Selected Members"}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title="Select Recipients" subtitle={`${selectedReports.length} of ${directReports.length} selected`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                    <button 
                      onClick={() => setSelectedReports(directReports.map(r => r.id))}
                      style={{ background: "none", border: "none", color: "var(--color-primary-500)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", cursor: "pointer" }}
                      type="button"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => setSelectedReports([])}
                      style={{ background: "none", border: "none", color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", cursor: "pointer" }}
                      type="button"
                    >
                      Deselect All
                    </button>
                  </div>

                  {directReports.length === 0 ? (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", textAlign: "center", padding: "var(--space-4) 0" }}>No direct reports found.</p>
                  ) : (
                    directReports.map(report => (
                      <label key={report.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: selectedReports.includes(report.id) ? "var(--color-primary-50)" : "var(--color-surface)", border: `1px solid ${selectedReports.includes(report.id) ? "var(--color-primary-200)" : "var(--color-border-subtle)"}`, borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.2s ease" }}>
                        <input 
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => toggleReport(report.id)}
                          style={{ width: 18, height: 18, accentColor: "var(--color-primary-500)" }}
                        />
                        <div>
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>{report.name}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>{report.department}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
