import * as React from "react";

import { cn } from "@/lib/utils";

export const Card = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    className={cn(
      "surface-panel rounded-lg p-4 shadow-[0_18px_42px_rgba(0,0,0,0.32)] transition hover:border-white/20",
      className
    )}
    {...props}
  />
);
