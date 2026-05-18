"use client";

interface TopbarProps {
  title: string;
  breadcrumbs?: string[];
  userName?: string;
}

export default function Topbar({ title, breadcrumbs, userName = "User" }: TopbarProps) {
  return (
    <header
      style={{
        height: "var(--topbar-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-6)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Breadcrumbs & Title */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-tertiary)",
              marginBottom: "2px",
            }}
          >
            {breadcrumbs.join(" / ")}
          </div>
        )}
        <h2
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h2>
      </div>

      {/* User Chip & Notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        {/* Notification Bell */}
        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            opacity: 0.7,
            transition: "opacity var(--duration-base) var(--ease-standard)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          🔔
        </button>

        {/* User Chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            background: "var(--color-surface-raised)",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--color-primary-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-primary-700)",
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-text-primary)",
            }}
          >
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
