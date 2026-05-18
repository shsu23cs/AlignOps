import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const getStyles = () => {
    const baseStyles: React.CSSProperties = {
      padding: "12px 24px",
      borderRadius: "var(--radius-md)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      cursor: disabled ? "not-allowed" : "pointer",
      border: "none",
      transition: "all var(--duration-base) var(--ease-standard)",
      opacity: disabled ? 0.45 : 1,
      width: fullWidth ? "100%" : "auto",
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyles,
          background: "var(--color-primary-500)",
          color: "var(--color-text-inverse)",
        };
      case "secondary":
        return {
          ...baseStyles,
          background: "var(--color-surface)",
          color: "var(--color-primary-500)",
          border: "1.5px solid var(--color-primary-500)",
        };
      case "ghost":
        return {
          ...baseStyles,
          background: "transparent",
          color: "var(--color-text-secondary)",
        };
      case "destructive":
        return {
          ...baseStyles,
          background: "var(--color-danger)",
          color: "var(--color-text-inverse)",
        };
      default:
        return baseStyles;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (variant) {
      case "primary":
        e.currentTarget.style.background = "var(--color-primary-600)";
        break;
      case "secondary":
        e.currentTarget.style.background = "var(--color-primary-50)";
        break;
      case "ghost":
        e.currentTarget.style.background = "var(--color-surface-sunken)";
        e.currentTarget.style.color = "var(--color-text-primary)";
        break;
      case "destructive":
        e.currentTarget.style.background = "#9A3628";
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (variant) {
      case "primary":
        e.currentTarget.style.background = "var(--color-primary-500)";
        break;
      case "secondary":
        e.currentTarget.style.background = "var(--color-surface)";
        break;
      case "ghost":
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--color-text-secondary)";
        break;
      case "destructive":
        e.currentTarget.style.background = "var(--color-danger)";
        break;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = "scale(0.98)";
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = "scale(1)";
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={getStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </button>
  );
}
