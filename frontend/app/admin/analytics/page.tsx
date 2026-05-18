"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    router.push("/login");
    return null;
  }
  if (!isLoading && user?.role !== "ADMIN") {
    router.push("/login");
    return null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role="admin" />
      <main style={{ marginLeft: "var(--sidebar-width)", flex: 1, background: "var(--color-canvas)" }}>
        <Topbar title="Analytics" breadcrumbs={["Admin", "Analytics"]} userName={user?.name || "Admin"} />
        <AnalyticsDashboard role="admin" />
      </main>
    </div>
  );
}
