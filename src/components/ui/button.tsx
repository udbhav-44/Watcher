"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition duration-200 ease-out-soft disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-fg-on-accent hover:bg-accent-hover shadow-sm shadow-black/20",
        ghost: "bg-fg/[0.06] text-fg hover:bg-fg/[0.12]",
        outline:
          "border border-border-strong/80 bg-transparent text-fg hover:border-border-strong hover:bg-fg/[0.06]",
        subtle: "bg-surface-3 text-fg hover:bg-surface-2",
        danger: "bg-danger/15 text-danger hover:bg-danger/25",
        accent:
          "bg-accent-soft text-accent border border-accent/40 hover:bg-accent/25"
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
