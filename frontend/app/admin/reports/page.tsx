"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { api, getAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CycleFromAPI {
  id: string;
  year: number;
  phase: string;
}

interface AchievementReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  goalId: string;
  goalTitle: string;
  weightage: number;
  q1Score: number | null;
  q2Score: number | null;
  q3Score: number | null;
  q4Score: number | null;
  overallScore: number | null;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [cycles, setCycles] = useState<CycleFromAPI[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  
  const [reportData, setReportData] = useState<AchievementReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  if (!authLoading && !user) { router.push("/login"); return null; }
  if (!authLoading && user?.role !== "ADMIN" && user?.role !== "MANAGER") {
    router.push("/login"); return null;
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cyclesData = await api.get<CycleFromAPI[]>("/cycles");
      setCycles(cyclesData);
      
      const defaultCycleId = selectedCycle || cyclesData.find(c => c.phase === "GOAL_SETTING")?.id || cyclesData[0]?.id || "";
      if (!selectedCycle && defaultCycleId) {
        setSelectedCycle(defaultCycleId);
      }

      let url = "/reports/achievement";
      const params = new URLSearchParams();
      if (defaultCycleId) params.append("cycleId", defaultCycleId);
      if (department) params.append("department", department);
      if (params.toString()) url += `?${params.toString()}`;

      const report = await api.get<{ data: any[] }>(url);
      const mappedData = (report.data || []).map((row: any) => {
        const getScore = (phase: string) => {
          const ach = row.achievements?.find((a: any) => a.phase === phase);
          return ach?.score !== undefined && ach?.score !== null ? Number(ach.score) : null;
        };
        const q1Score = getScore("Q1");
        const q2Score = getScore("Q2");
        const q3Score = getScore("Q3");
        const q4Score = getScore("Q4");
        
        let overallScore = null;
        const validScores = [q1Score, q2Score, q3Score, q4Score].filter(s => s !== null) as number[];
        if (validScores.length > 0) {
           overallScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        }

        return {
          employeeId: row.employee?.id,
          employeeName: row.employee?.name || "Unknown",
          department: row.employee?.department || "Unknown",
          goalId: row.goal?.id,
          goalTitle: row.goal?.title || "Unknown Goal",
          weightage: row.goal?.weightage || 0,
          q1Score,
          q2Score,
          q3Score,
          q4Score,
          overallScore
        };
      });
      setReportData(mappedData);
    } catch (err) {
      setError("Failed to load achievement report.");
    } finally {
      setLoading(false);
    }
  }, [selectedCycle, department]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const accessToken = getAccessToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      
      const params = new URLSearchParams();
      if (selectedCycle) params.append("cycleId", selectedCycle);
      if (department) params.append("department", department);
      
      const url = `${API_BASE}/reports/achievement/export${params.toString() ? `?${params.toString()}` : ""}`;
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `achievement-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to export report.");
    } finally {
      setExportLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "inherit";
    if (score >= 90) return "var(--color-score-excellent)";
    if (score >= 70) return "var(--color-score-good)";
    if (score >= 50) return "var(--color-score-moderate)";
    return "var(--color-score-low)";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={user?.role?.toLowerCase() as any} />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Achievement Report" breadcrumbs={[user?.role === "ADMIN" ? "Admin" : "Manager", "Reports"]} userName={user?.name || "User"} />
        
        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          
          <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
                Organization Achievement
              </h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
                Review and export real-time goal scores across the organization.
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: 4 }}>Cycle</label>
                <select 
                  value={selectedCycle} 
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  style={{ padding: "8px 12px", border: "1.5px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}
                >
                  <option value="">All Cycles</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>FY {c.year} - {c.phase}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)", marginBottom: 4 }}>Department</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ padding: "8px 12px", border: "1.5px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>
          </div>

          <Card title="Detailed Report" subtitle="Per-goal achievement tracking">
            <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>Showing {reportData.length} records</p>
              {user?.role === "ADMIN" && (
                <Button onClick={handleExport} disabled={exportLoading}>
                  {exportLoading ? "Exporting..." : "⬇ Export CSV"}
                </Button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "var(--space-10)" }}>Loading report data...</div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-danger)" }}>{error}</div>
            ) : reportData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-tertiary)" }}>No records found for the selected filters.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--color-surface-sunken)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Employee</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Goal Title</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Weight</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Q1</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Q2</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Q3</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Q4</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-subtle)" }}>Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>{row.employeeName}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{row.department}</div>
                        </td>
                        <td style={{ padding: "12px 16px", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row.goalTitle}>
                          {row.goalTitle}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)" }}>
                          {row.weightage}%
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-semibold)", color: getScoreColor(row.q1Score) }}>
                          {row.q1Score !== null ? `${Math.round(row.q1Score * 100)}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-semibold)", color: getScoreColor(row.q2Score) }}>
                          {row.q2Score !== null ? `${Math.round(row.q2Score * 100)}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-semibold)", color: getScoreColor(row.q3Score) }}>
                          {row.q3Score !== null ? `${Math.round(row.q3Score * 100)}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-semibold)", color: getScoreColor(row.q4Score) }}>
                          {row.q4Score !== null ? `${Math.round(row.q4Score * 100)}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: "var(--weight-bold)", color: getScoreColor(row.overallScore) }}>
                          {row.overallScore !== null ? `${Math.round(row.overallScore * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
