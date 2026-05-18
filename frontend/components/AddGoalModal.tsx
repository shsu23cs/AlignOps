"use client";
import { useState } from "react";
import Button from "@/components/Button";
import { AlignOpsApiError } from "@/lib/api";

interface Props {
  onAdd: (data: {
    thrustArea: string; title: string; description: string;
    uomType: string; target?: number | null; targetDate?: string | null; weightage: number;
  }) => Promise<void>;
  onClose: () => void;
  disabled?: boolean;
}

const UOM_OPTIONS = [
  { value: "NUMERIC_MIN", label: "Numeric (Higher is Better)", hint: "e.g. Sales Revenue" },
  { value: "NUMERIC_MAX", label: "Numeric (Lower is Better)", hint: "e.g. TAT, Cost" },
  { value: "TIMELINE",    label: "Timeline (Date-based)",      hint: "Complete by date" },
  { value: "ZERO",        label: "Zero-based",                 hint: "0 = success, e.g. Incidents" },
];

export default function AddGoalModal({ onAdd, onClose, disabled }: Props) {
  const [thrustArea, setThrustArea] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uomType, setUomType] = useState("NUMERIC_MIN");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [weightage, setWeightage] = useState("10");
  const [localError, setLocalError] = useState("");
  /** Per-field errors extracted from 422 responses */
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});

  const isTimeline = uomType === "TIMELINE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    setServerFieldErrors({});

    // Client-side checks
    if (!thrustArea.trim() || !title.trim() || !description.trim()) {
      setLocalError("Thrust Area, Title, and Description are required."); return;
    }
    const w = parseInt(weightage, 10);
    if (isNaN(w) || w < 10 || w > 100) {
      setLocalError("Weightage must be between 10 and 100."); return;
    }
    try {
      await onAdd({
        thrustArea: thrustArea.trim(), title: title.trim(), description: description.trim(),
        uomType,
        target: isTimeline ? null : (target ? parseFloat(target) : null),
        targetDate: isTimeline && targetDate ? targetDate : null,
        weightage: w,
      });
      onClose();
    } catch (err) {
      // Show 422 server-side validation errors inline on the form
      if (err instanceof AlignOpsApiError && err.isValidationError) {
        setServerFieldErrors(err.fieldErrors);
        setLocalError(err.apiError.message);
      } else if (err instanceof AlignOpsApiError) {
        setLocalError(err.apiError.message);
      }
      // errors are also shown at page level via hook state
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1.5px solid var(--color-border-strong)",
    borderRadius: "var(--radius-md)", fontSize: "var(--text-base)",
    background: "var(--color-surface)", color: "var(--color-text-primary)", outline: "none",
  };
  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    border: "1.5px solid var(--color-danger)",
    background: "var(--color-danger-bg)",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: "6px", fontSize: "var(--text-sm)",
    fontWeight: "var(--weight-semibold)" as any, color: "var(--color-text-primary)",
  };
  const fieldErrorStyle: React.CSSProperties = {
    fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: 4,
  };

  function getInputStyle(fieldName: string) {
    return serverFieldErrors[fieldName] ? inputErrorStyle : inputStyle;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      {/* Modal */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto",
        background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xl)", padding: "var(--space-8)",
      }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)" as any, marginBottom: "var(--space-6)", color: "var(--color-text-primary)" }}>
          Add New Goal
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <div>
              <label style={labelStyle}>Thrust Area</label>
              <input style={getInputStyle("thrustArea")} value={thrustArea} onChange={(e) => setThrustArea(e.target.value)} placeholder="e.g. Revenue Growth" />
              {serverFieldErrors["thrustArea"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["thrustArea"]}</p>}
            </div>
            <div>
              <label style={labelStyle}>Goal Title</label>
              <input style={getInputStyle("title")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Increase Sales Revenue" />
              {serverFieldErrors["title"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["title"]}</p>}
            </div>
          </div>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...getInputStyle("description"), minHeight: 80, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the goal and expected outcomes..." />
            {serverFieldErrors["description"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["description"]}</p>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <div>
              <label style={labelStyle}>Unit of Measurement</label>
              <select style={getInputStyle("uomType")} value={uomType} onChange={(e) => setUomType(e.target.value)}>
                {UOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: 4 }}>
                {UOM_OPTIONS.find((o) => o.value === uomType)?.hint}
              </p>
              {serverFieldErrors["uomType"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["uomType"]}</p>}
            </div>
            <div>
              {isTimeline ? (
                <>
                  <label style={labelStyle}>Target Date</label>
                  <input type="date" style={getInputStyle("targetDate")} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  {serverFieldErrors["targetDate"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["targetDate"]}</p>}
                </>
              ) : (
                <>
                  <label style={labelStyle}>Target Value</label>
                  <input type="number" step="any" style={getInputStyle("target")} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 1000000" />
                  {serverFieldErrors["target"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["target"]}</p>}
                </>
              )}
            </div>
          </div>
          <div style={{ marginBottom: "var(--space-6)" }}>
            <label style={labelStyle}>Weightage (%)</label>
            <input type="number" min={10} max={100} style={{ ...getInputStyle("weightage"), width: 120 }} value={weightage} onChange={(e) => setWeightage(e.target.value)} />
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: 4 }}>Minimum 10%, total across all goals must equal 100%</p>
            {serverFieldErrors["weightage"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["weightage"]}</p>}
            {serverFieldErrors["goal_count"] && <p style={fieldErrorStyle}>⚠ {serverFieldErrors["goal_count"]}</p>}
          </div>

          {/* Server-side 422 validation error summary */}
          {localError && (
            <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-danger-bg)", borderLeft: "3px solid var(--color-danger)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
              ⚠ {localError}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={disabled}>Add Goal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
