import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Reusable empty / zero state. Use anywhere a list, rail, or section
 * resolves to no items so the user understands what's happening and what
 * to do next. Keep copy short and action-oriented.
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps): JSX.Element => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center",
      className
    )}
    role="status"
  >
    {icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fg/[0.06] text-fg-muted">
        {icon}
      </div>
    )}
    <div className="space-y-1">
      <p className="text-base font-medium text-fg">{title}</p>
      {description && (
        <p className="max-w-sm text-pretty text-sm text-fg-muted">
          {description}
        </p>
      )}
    </div>
    {action && <div className="pt-1">{action}</div>}
  </div>
);
