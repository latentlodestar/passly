import { cn } from "../lib/cn";
import type { ReactNode } from "react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const icons: Record<string, string> = {
  info: "\u2139\uFE0F",
  success: "\u2713",
  warning: "\u26A0",
  danger: "\u2717",
};

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  return (
    <div className={cn("alert", `alert--${variant}`, className)} role="alert">
      <span className="alert__icon" aria-hidden="true">
        {icons[variant]}
      </span>
      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        {children}
      </div>
      {onDismiss && (
        <button
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}
