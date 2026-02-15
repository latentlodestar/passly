import { cn } from "../lib/cn";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("stepper", className)} role="navigation" aria-label="Progress">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={index} className="stepper__step-group" style={{ display: "contents" }}>
            <div
              className={cn(
                "stepper__step",
                isCompleted && "stepper__step--completed",
                isCurrent && "stepper__step--current",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="stepper__indicator">
                {isCompleted ? "\u2713" : index + 1}
              </div>
              <span className="stepper__label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "stepper__connector",
                  isCompleted && "stepper__connector--completed",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn("progress", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "progress__bar",
          variant !== "primary" && `progress__bar--${variant}`,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
