import * as React from "react";

import { cn } from "@/lib/utils";

export const Card = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    className={cn(
      "rounded-lg border border-border bg-surface-2/95 p-4 shadow-card transition hover:border-border-strong",
      className
    )}
    {...props}
  />
);
