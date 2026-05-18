import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({ children, title, subtitle, badge, noPadding = false }: CardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {(title || subtitle || badge) && (
        <>
          <div
            style={{
              padding: "20px 24px 16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              {title && (
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-semibold)",
                    color: "var(--color-text-primary)",
                    marginBottom: subtitle ? "4px" : 0,
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {badge && <div>{badge}</div>}
          </div>
          <div
            style={{
              height: "1px",
              background: "var(--color-border-subtle)",
            }}
          />
        </>
      )}
      <div style={{ padding: noPadding ? 0 : "var(--space-6)" }}>{children}</div>
    </div>
  );
}
