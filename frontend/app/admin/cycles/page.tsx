"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";

export default function CyclesPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="admin" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Cycle Management" breadcrumbs={["Admin", "Cycles"]} userName="HR Admin" />
        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          <Card title="Configure Cycle Windows">
            <p style={{ color: "var(--color-text-secondary)" }}>Set open and close dates for each phase window.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
