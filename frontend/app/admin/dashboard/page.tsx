"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

interface CompletionStats {
  phase: string;
  totalEmployees: number;
  submitted: number;
  approved: number;
  managerCheckinsComplete: number;
  totalManagers: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const stats: CompletionStats[] = [
    {
      phase: "Goal Setting",
      totalEmployees: 150,
      submitted: 142,
      approved: 138,
      managerCheckinsComplete: 0,
      totalManagers: 15,
    },
    {
      phase: "Q1 Check-in",
      totalEmployees: 150,
      submitted: 135,
      approved: 135,
      managerCheckinsComplete: 12,
      totalManagers: 15,
    },
    {
      phase: "Q2 Check-in",
      totalEmployees: 150,
      submitted: 128,
      approved: 128,
      managerCheckinsComplete: 10,
      totalManagers: 15,
    },
    {
      phase: "Q3 Check-in",
      totalEmployees: 150,
      submitted: 0,
      approved: 0,
      managerCheckinsComplete: 0,
      totalManagers: 15,
    },
  ];

  const currentCycle = {
    name: "FY 2025-26",
    goalSettingOpen: "May 1, 2025",
    goalSettingClose: "May 31, 2025",
    currentPhase: "Q2 Check-in",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="admin" />

      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          flex: 1,
          background: "var(--color-canvas)",
        }}
      >
        <Topbar title="Completion Dashboard" breadcrumbs={["Admin", "Dashboard"]} userName="HR Admin" />

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
              System Overview
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Real-time view of goal submission and check-in completion across the organization.
            </p>
          </div>

          {/* Current Cycle Info */}
          <Card title="Current Cycle" subtitle={currentCycle.name}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-2)" }}>
                  Goal Setting Window
                </p>
                <p style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                  {currentCycle.goalSettingOpen} — {currentCycle.goalSettingClose}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-2)" }}>
                  Current Phase
                </p>
                <p style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--color-accent-700)" }}>
                  {currentCycle.currentPhase}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <Button variant="secondary" onClick={() => router.push("/admin/cycles")}>Manage Cycles</Button>
              </div>
            </div>
          </Card>

          {/* Completion Statistics */}
          <div style={{ marginTop: "var(--space-8)" }}>
            <h2
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--color-text-primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              Completion Statistics
            </h2>

            <Card noPadding>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--color-surface-sunken)" }}>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--color-text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-widest)",
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        Phase
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--color-text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-widest)",
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        Employee Submissions
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--color-text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-widest)",
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        Approved Goals
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--color-text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-widest)",
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        Manager Check-ins
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-semibold)",
                          color: "var(--color-text-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-widest)",
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        Completion %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat, index) => {
                      const submissionRate = Math.round((stat.submitted / stat.totalEmployees) * 100);
                      const approvalRate = Math.round((stat.approved / stat.totalEmployees) * 100);
                      const checkinRate = Math.round((stat.managerCheckinsComplete / stat.totalManagers) * 100);

                      return (
                        <tr
                          key={stat.phase}
                          style={{
                            background: index % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-raised)",
                          }}
                        >
                          <td style={{ padding: "16px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
                              {stat.phase}
                            </span>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
                              {stat.submitted} / {stat.totalEmployees}
                            </div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                              {submissionRate}%
                            </div>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
                              {stat.approved} / {stat.totalEmployees}
                            </div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                              {approvalRate}%
                            </div>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
                              {stat.managerCheckinsComplete} / {stat.totalManagers}
                            </div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                              {checkinRate}%
                            </div>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <div
                              style={{
                                display: "inline-block",
                                padding: "4px 12px",
                                borderRadius: "var(--radius-full)",
                                background: approvalRate >= 90 ? "var(--color-success-bg)" : approvalRate >= 70 ? "var(--color-warning-bg)" : "var(--color-danger-bg)",
                                color: approvalRate >= 90 ? "var(--color-success)" : approvalRate >= 70 ? "var(--color-warning)" : "var(--color-danger)",
                                fontSize: "var(--text-sm)",
                                fontFamily: "var(--font-mono)",
                                fontWeight: "var(--weight-semibold)",
                              }}
                            >
                              {approvalRate}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: "var(--space-8)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)" }}>
            <Button variant="secondary" fullWidth onClick={() => router.push("/admin/reports")}>
              Export Achievement Report
            </Button>
            <Button variant="secondary" fullWidth onClick={() => router.push("/admin/audit")}>
              View Audit Log
            </Button>
            <Button variant="secondary" fullWidth onClick={() => router.push("/admin/users")}>
              Manage Users
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
