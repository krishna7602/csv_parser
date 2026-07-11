"use client";

import React from "react";

const STEPS = [
  { id: 1, label: "Upload", icon: "📤" },
  { id: 2, label: "Preview", icon: "👁️" },
  { id: 3, label: "Import", icon: "⚡" },
  { id: 4, label: "Results", icon: "✅" },
];

const STEP_MAP: Record<string, number> = {
  idle: 1,
  uploading: 1,
  previewing: 2,
  importing: 3,
  done: 4,
  error: 4,
};

interface StepIndicatorProps {
  currentStep: string;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const activeStep = STEP_MAP[currentStep] ?? 1;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center" }}>
      {STEPS.map((step, index) => {
        const isCompleted = step.id < activeStep;
        const isActive = step.id === activeStep;
        const isUpcoming = step.id > activeStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                position: "relative",
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isCompleted ? "1rem" : "0.875rem",
                  fontWeight: 700,
                  transition: "all 0.3s ease",
                  background: isCompleted
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : isActive
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(42,42,58,0.8)",
                  border: isActive
                    ? "2px solid transparent"
                    : isCompleted
                    ? "2px solid transparent"
                    : "2px solid #2a2a3a",
                  boxShadow: isActive
                    ? "0 0 20px rgba(99,102,241,0.5)"
                    : "none",
                  color: isUpcoming ? "#64748b" : "white",
                }}
              >
                {isCompleted ? "✓" : step.icon}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? "#a5b4fc"
                    : isCompleted
                    ? "#94a3b8"
                    : "#475569",
                  transition: "color 0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 2,
                  marginBottom: 22,
                  background: step.id < activeStep
                    ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                    : "#2a2a3a",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
