"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Card from "@/components/Card";

export default function UsersPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="admin" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Users & Organization" breadcrumbs={["Admin", "Users"]} userName="HR Admin" />
        <div style={{ padding: "var(--space-8)", maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
          <Card title="User Management">
            <p style={{ color: "var(--color-text-secondary)" }}>Manage employees, managers, and org hierarchy.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
