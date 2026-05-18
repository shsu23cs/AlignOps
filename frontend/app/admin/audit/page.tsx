"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";

export default function AuditPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="admin" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Audit Log" breadcrumbs={["Admin", "Audit"]} userName="HR Admin" />
        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          <Card title="System Audit Trail">
            <p style={{ color: "var(--color-text-secondary)" }}>View all post-lock changes with actor, field, and before/after values.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
