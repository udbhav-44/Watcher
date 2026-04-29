import * as React from "react";

import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn("glass-panel rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)]", className)} {...props} />
);
