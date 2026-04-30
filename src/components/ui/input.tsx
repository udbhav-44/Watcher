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
        "h-10 w-full rounded-lg border border-white/15 bg-black/35 px-3 text-sm text-white placeholder:text-white/40",
        "transition outline-none focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
