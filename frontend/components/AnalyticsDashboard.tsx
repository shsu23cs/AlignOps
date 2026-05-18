"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { api } from "@/lib/api";

interface Cycle {
  id: string;
  year: number;
  phase: string;
}

interface AchievementData {
  employee: { id: string; name: string; department: string };
  cycle: { year: number; phase: string };
  goal: { id: string; thrustArea: string; title: string; uomType: string; target: number | null; weightage: number; isShared: boolean };
  achievements: { phase: string; actualValue: string | null; status: string; score: number | null; scorePercent: number | null }[];
}

interface AnalyticsDashboardProps {
  role: "manager" | "admin";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF"];

export default function AnalyticsDashboard({ role }: AnalyticsDashboardProps) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [data, setData] = useState<AchievementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const cyclesRes = await api.get<Cycle[]>("/cycles");
        setCycles(cyclesRes);
        const defaultCycleId = cyclesRes.find((c) => c.phase === "GOAL_SETTING")?.id || cyclesRes[0]?.id || "";
        if (defaultCycleId) setSelectedCycle(defaultCycleId);
      } catch (err) {
        console.error("Failed to load cycles", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = "/reports/achievement?limit=1000";
        if (selectedCycle) url += `&cycleId=${selectedCycle}`;
        if (department) url += `&department=${department}`;
        const res = await api.get<{ data: AchievementData[] }>(url);
        setData(res.data || []);
      } catch (err) {
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    if (selectedCycle !== "") fetchData();
  }, [selectedCycle, department]);

  // Calculations for QoQ Trends
  const qoqTrends = useMemo(() => {
    if (!data.length) return [];
    let q1Score = 0, q1Count = 0;
    let q2Score = 0, q2Count = 0;
    let q3Score = 0, q3Count = 0;
    let q4Score = 0, q4Count = 0;

    data.forEach(row => {
      row.achievements.forEach(a => {
        if (a.scorePercent !== null) {
          if (a.phase === "Q1") { q1Score += a.scorePercent; q1Count++; }
          if (a.phase === "Q2") { q2Score += a.scorePercent; q2Count++; }
          if (a.phase === "Q3") { q3Score += a.scorePercent; q3Count++; }
          if (a.phase === "Q4") { q4Score += a.scorePercent; q4Count++; }
        }
      });
    });

    return [
      { phase: "Q1", score: q1Count ? Math.round(q1Score / q1Count) : 0 },
      { phase: "Q2", score: q2Count ? Math.round(q2Score / q2Count) : 0 },
      { phase: "Q3", score: q3Count ? Math.round(q3Score / q3Count) : 0 },
      { phase: "Q4", score: q4Count ? Math.round(q4Score / q4Count) : 0 },
    ];
  }, [data]);

  // Organization Heatmaps (Average Score by Department)
  const deptPerformance = useMemo(() => {
    if (!data.length) return [];
    const deptScores: Record<string, { total: number, count: number }> = {};
    
    data.forEach(row => {
      // average out the scores across phases for this goal
      let scoreSum = 0;
      let count = 0;
      row.achievements.forEach(a => {
        if (a.scorePercent !== null) {
          scoreSum += a.scorePercent;
          count++;
        }
      });
      if (count > 0) {
        const avg = scoreSum / count;
        if (!deptScores[row.employee.department]) deptScores[row.employee.department] = { total: 0, count: 0 };
        deptScores[row.employee.department].total += avg;
        deptScores[row.employee.department].count++;
      }
    });

    return Object.keys(deptScores).map(dept => ({
      department: dept,
      score: Math.round(deptScores[dept].total / deptScores[dept].count)
    }));
  }, [data]);

  // Goal Distribution (Count of goals by score range)
  const goalDistribution = useMemo(() => {
    if (!data.length) return [];
    let ranges = { "0-50%": 0, "51-70%": 0, "71-90%": 0, "91-100%": 0 };
    data.forEach(row => {
      let scoreSum = 0; let count = 0;
      row.achievements.forEach(a => {
        if (a.scorePercent !== null) { scoreSum += a.scorePercent; count++; }
      });
      if (count > 0) {
        const avg = scoreSum / count;
        if (avg <= 50) ranges["0-50%"]++;
        else if (avg <= 70) ranges["51-70%"]++;
        else if (avg <= 90) ranges["71-90%"]++;
        else ranges["91-100%"]++;
      }
    });
    return Object.keys(ranges).map(range => ({
      name: range,
      value: ranges[range as keyof typeof ranges]
    }));
  }, [data]);

  // Manager Effectiveness (Inferred by percentage of shared goals or high scoring goals)
  // Since we don't have manager explicit data in rows, we just use Thrust Area distribution
  const thrustAreaDistribution = useMemo(() => {
    if (!data.length) return [];
    const counts: Record<string, number> = {};
    data.forEach(row => {
      counts[row.goal.thrustArea] = (counts[row.goal.thrustArea] || 0) + 1;
    });
    return Object.keys(counts).map(ta => ({
      name: ta,
      value: counts[ta]
    }));
  }, [data]);

  return (
    <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
            Insights and trends on organizational performance.
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
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  FY {c.year} - {c.phase}
                </option>
              ))}
            </select>
          </div>
          {role === "admin" && (
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
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-10)" }}>Loading analytics...</div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-danger)" }}>{error}</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-tertiary)" }}>No records found for the selected filters.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
          
          <Card title="QoQ Trends" subtitle="Average goal score progression over quarters">
            <div style={{ width: "100%", height: 300, marginTop: "var(--space-4)" }}>
              <ResponsiveContainer>
                <LineChart data={qoqTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="phase" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" name="Avg Score (%)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Department Heatmap" subtitle="Average overall score by department">
            <div style={{ width: "100%", height: 300, marginTop: "var(--space-4)" }}>
              <ResponsiveContainer>
                <BarChart data={deptPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip cursor={{fill: 'var(--color-surface-sunken)'}} />
                  <Legend />
                  <Bar dataKey="score" name="Avg Score (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Goal Score Distribution" subtitle="Distribution of overall goal scores">
            <div style={{ width: "100%", height: 300, marginTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={goalDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {goalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Thrust Area Focus" subtitle="Distribution of goals across strategic thrust areas">
            <div style={{ width: "100%", height: 300, marginTop: "var(--space-4)" }}>
              <ResponsiveContainer>
                <BarChart data={thrustAreaDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{fill: 'var(--color-surface-sunken)'}} />
                  <Legend />
                  <Bar dataKey="value" name="Goal Count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
