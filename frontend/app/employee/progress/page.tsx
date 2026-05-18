"use client";

import { useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { useGoals } from "@/lib/use-goals";
import { useRouter } from "next/navigation";

export default function ProgressPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { sheet, activeCycle, loading, error } = useGoals();

  // Auth guard
  if (!authLoading && !user) { router.push("/login"); return null; }

  const getScoreColor = (progress: number) => {
    if (progress >= 90) return "var(--color-score-excellent)";
    if (progress >= 70) return "var(--color-score-good)";
    if (progress >= 50) return "var(--color-score-moderate)";
    return "var(--color-score-low)";
  };

  const calculatedProgress = useMemo(() => {
    if (!sheet || !sheet.goals) return { overall: 0, goals: [] };

    let totalScore = 0;
    const goalsData = sheet.goals.map((goal) => {
      // Find the latest achievement score by looking at Q4 -> Q3 -> Q2 -> Q1
      let latestScore = 0;
      let latestActual = "—";
      
      const quarters = ["Q4", "Q3", "Q2", "Q1"];
      for (const q of quarters) {
        const ach = goal.achievements?.find(a => a.cyclePhase === q);
        if (ach && ach.score !== null && ach.score !== undefined) {
          latestScore = Number(ach.score) * 100;
          latestActual = goal.uomType === "TIMELINE" 
            ? (ach.actualDate ? new Date(ach.actualDate).toLocaleDateString() : "—")
            : (ach.actualValue !== null && ach.actualValue !== undefined ? String(ach.actualValue) : "—");
          break;
        }
      }

      // Add to weighted overall score
      totalScore += latestScore * (Number(goal.weightage) / 100);

      return {
        title: goal.title,
        target: goal.uomType === "TIMELINE" ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "—") : String(goal.target ?? "—"),
        actual: latestActual,
        progress: Math.round(latestScore),
      };
    });

    return { overall: Math.round(totalScore), goals: goalsData };
  }, [sheet]);

  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar role="employee" />
        <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: "var(--space-4)", animation: "pulse 1.5s ease infinite" }}>⏳</div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading progress…</p>
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
        <Topbar title="My Progress" breadcrumbs={["Employee", "Progress"]} userName={user?.name || "Employee"} />

        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          {/* Page Header */}
          <div style={{ marginBottom: "var(--space-8)" }}>
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
              Progress Dashboard
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Track your goal achievement progress throughout the year based on real-time calculated scores.
            </p>
          </div>

          {/* Overall Progress */}
          <Card title="Overall Progress" subtitle={activeCycle ? `FY ${activeCycle.year}-${(activeCycle.year + 1).toString().slice(2)}` : ""}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "var(--space-8)" }}>
              <div style={{ position: "relative", width: "160px", height: "160px" }}>
                <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="var(--color-border-subtle)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={getScoreColor(calculatedProgress.overall)}
                    strokeWidth="12"
                    strokeDasharray={`${(Math.min(calculatedProgress.overall, 100) / 100) * 439.6} 439.6`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-4xl)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: "var(--weight-bold)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {calculatedProgress.overall}%
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "var(--tracking-wide)",
                    }}
                  >
                    Complete
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Individual Goal Progress */}
          <div style={{ marginTop: "var(--space-8)" }}>
            <h2
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              Goal Breakdown
            </h2>

            {calculatedProgress.goals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-8)", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-subtle)" }}>
                <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-tertiary)" }}>No goals found. Set up your goals to track progress.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-4)" }}>
                {calculatedProgress.goals.map((goal, index) => (
                  <Card key={index}>
                    <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
                      {/* Score Ring */}
                      <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
                        <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            fill="none"
                            stroke="var(--color-border-subtle)"
                            strokeWidth="6"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            fill="none"
                            stroke={getScoreColor(goal.progress)}
                            strokeWidth="6"
                            strokeDasharray={`${(Math.min(goal.progress, 100) / 100) * 219.8} 219.8`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "var(--text-lg)",
                            fontFamily: "var(--font-mono)",
                            fontWeight: "var(--weight-bold)",
                            color: getScoreColor(goal.progress),
                          }}
                        >
                          {goal.progress}%
                        </div>
                      </div>

                      {/* Goal Details */}
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "var(--text-base)",
                            fontWeight: "var(--weight-semibold)",
                            color: "var(--color-text-primary)",
                            marginBottom: "var(--space-2)",
                          }}
                        >
                          {goal.title}
                        </h3>
                        <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-sm)" }}>
                          <div>
                            <span style={{ color: "var(--color-text-tertiary)" }}>Target: </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: "var(--weight-medium)",
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {goal.target}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "var(--color-text-tertiary)" }}>Actual: </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: "var(--weight-medium)",
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {goal.actual}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
