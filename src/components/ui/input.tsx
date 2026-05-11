"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-black/35 px-3 text-sm text-fg placeholder:text-fg-faint",
        "transition outline-none focus-visible:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/70",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
