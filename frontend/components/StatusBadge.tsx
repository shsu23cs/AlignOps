interface StatusBadgeProps {
  status: "not-started" | "on-track" | "completed" | "returned" | "locked" | "overdue" | "pending" | "approved";
  label?: string;
}

const statusConfig = {
  "not-started": {
    bg: "#EEE9DF",
    color: "var(--color-text-tertiary)",
    label: "Not Started",
  },
  "on-track": {
    bg: "var(--color-success-bg)",
    color: "var(--color-success)",
    label: "On Track",
  },
  completed: {
    bg: "var(--color-primary-100)",
    color: "var(--color-primary-600)",
    label: "Completed",
  },
  returned: {
    bg: "var(--color-warning-bg)",
    color: "var(--color-warning)",
    label: "Returned",
  },
  locked: {
    bg: "var(--color-surface-sunken)",
    color: "var(--color-text-disabled)",
    label: "Locked",
  },
  overdue: {
    bg: "var(--color-danger-bg)",
    color: "var(--color-danger)",
    label: "Overdue",
  },
  pending: {
    bg: "var(--color-warning-bg)",
    color: "var(--color-warning)",
    label: "Pending Approval",
  },
  approved: {
    bg: "var(--color-success-bg)",
    color: "var(--color-success)",
    label: "Approved",
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        background: config.bg,
        color: config.color,
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-wide)",
      }}
    >
      {displayLabel}
    </span>
  );
}
