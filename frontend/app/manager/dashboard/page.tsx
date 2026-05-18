"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/Button";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  goalStatus: "not-started" | "pending" | "approved";
  goalCount: number;
  weightageValid: boolean;
  q1Complete: boolean;
  q2Complete: boolean;
  q3Complete: boolean;
  q4Complete: boolean;
}

export default function ManagerDashboardPage() {
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@company.com",
      goalStatus: "pending",
      goalCount: 6,
      weightageValid: true,
      q1Complete: true,
      q2Complete: false,
      q3Complete: false,
      q4Complete: false,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      goalStatus: "approved",
      goalCount: 8,
      weightageValid: true,
      q1Complete: true,
      q2Complete: true,
      q3Complete: false,
      q4Complete: false,
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      goalStatus: "not-started",
      goalCount: 0,
      weightageValid: false,
      q1Complete: false,
      q2Complete: false,
      q3Complete: false,
      q4Complete: false,
    },
  ];

  const pendingApprovals = teamMembers.filter((m) => m.goalStatus === "pending").length;
  const approvedGoals = teamMembers.filter((m) => m.goalStatus === "approved").length;
  const totalMembers = teamMembers.length;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="manager" />

      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          flex: 1,
          background: "var(--color-canvas)",
        }}
      >
        <Topbar title="Team Dashboard" breadcrumbs={["Manager", "Dashboard"]} userName="Sarah Manager" />

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
              Team Goal Management
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
              Review and approve team goals, monitor progress, and conduct quarterly check-ins.
            </p>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "var(--text-4xl)",
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--weight-bold)",
                    color: "var(--color-warning)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {pendingApprovals}
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                  Pending Approvals
                </p>
              </div>
            </Card>

            <Card>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "var(--text-4xl)",
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--weight-bold)",
                    color: "var(--color-success)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {approvedGoals}
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                  Approved Goals
                </p>
              </div>
            </Card>

            <Card>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "var(--text-4xl)",
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--weight-bold)",
                    color: "var(--color-primary-500)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {totalMembers}
                </div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                  Team Members
                </p>
              </div>
            </Card>
          </div>

          {/* Team Members Table */}
          <Card title="Team Members" subtitle="Goal submission and check-in status">
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
                      Employee
                    </th>
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
                      Goal Status
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
                      Goals
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
                      Q1
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
                      Q2
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
                      Q3
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr
                      key={member.id}
                      style={{
                        background: index % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-raised)",
                        transition: "background var(--duration-base) var(--ease-standard)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-primary-50)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-raised)";
                      }}
                    >
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <div>
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>{member.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <StatusBadge status={member.goalStatus} />
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" }}>
                          {member.goalCount}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <span style={{ fontSize: "20px" }}>{member.q1Complete ? "✓" : "—"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <span style={{ fontSize: "20px" }}>{member.q2Complete ? "✓" : "—"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <span style={{ fontSize: "20px" }}>{member.q3Complete ? "✓" : "—"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)" }}>
                        {member.goalStatus === "pending" && (
                          <Button variant="secondary">Review</Button>
                        )}
                        {member.goalStatus === "approved" && (
                          <Button variant="ghost">View</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
