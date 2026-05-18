"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";

export default function CheckinsPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="manager" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Check-ins" breadcrumbs={["Manager", "Check-ins"]} userName="Sarah Manager" />
        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          <Card title="Quarterly Check-ins">
            <p style={{ color: "var(--color-text-secondary)" }}>Conduct quarterly check-ins with your team.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
