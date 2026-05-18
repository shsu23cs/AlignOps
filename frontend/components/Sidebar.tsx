"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  role: "employee" | "manager" | "admin";
}

const navItems: Record<string, NavItem[]> = {
  employee: [
    { label: "My Goals", href: "/employee/goals", icon: "🎯" },
    { label: "Quarterly Updates", href: "/employee/updates", icon: "📊" },
    { label: "My Progress", href: "/employee/progress", icon: "📈" },
  ],
  manager: [
    { label: "Team Dashboard", href: "/manager/dashboard", icon: "👥" },
    { label: "Goal Approvals", href: "/manager/approvals", icon: "✓" },
    { label: "Check-ins", href: "/manager/checkins", icon: "📋" },
    { label: "Shared Goals", href: "/manager/shared-goals", icon: "🔗" },
    { label: "Analytics", href: "/manager/analytics", icon: "📈" },
  ],
  admin: [
    { label: "Completion Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Cycle Management", href: "/admin/cycles", icon: "📅" },
    { label: "Users & Org", href: "/admin/users", icon: "👤" },
    { label: "Achievement Report", href: "/admin/reports", icon: "📄" },
    { label: "Audit Log", href: "/admin/audit", icon: "🕐" },
    { label: "Analytics", href: "/admin/analytics", icon: "📈" },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems[role] || [];

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        height: "100vh",
        background: "var(--color-primary-700)",
        position: "fixed",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          height: "var(--topbar-height)",
          background: "var(--color-primary-900)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid var(--color-primary-600)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-bold)",
            color: "var(--color-text-inverse)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          AlignOps
        </h1>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: "var(--space-4) 0" }}>
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "var(--space-3) var(--space-4)",
                color: "var(--color-text-inverse)",
                opacity: isActive ? 1 : 0.7,
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                textDecoration: "none",
                background: isActive ? "var(--color-primary-600)" : "transparent",
                borderLeft: isActive ? "3px solid var(--color-accent-500)" : "3px solid transparent",
                transition: "all var(--duration-base) var(--ease-standard)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = "var(--color-primary-600)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = "0.7";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ marginRight: "var(--space-3)", fontSize: "20px" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role Chip & Sign Out */}
      <div style={{ padding: "var(--space-4)" }}>
        <div
          style={{
            background: "var(--color-primary-600)",
            color: "var(--color-accent-300)",
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          {role}
        </div>
        <Link
          href="/login"
          style={{
            display: "block",
            textAlign: "center",
            color: "var(--color-text-inverse)",
            opacity: 0.7,
            fontSize: "var(--text-sm)",
            textDecoration: "none",
            transition: "opacity var(--duration-base) var(--ease-standard)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
