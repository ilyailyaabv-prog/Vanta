import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — Badge Component
 * Variants: copper, gray, green (viewed), subtle
 * ───────────────────────────────────────────── */

const variants = {
  copper:
    "bg-copper-subtle text-copper-light border-copper/20",
  gray:
    "bg-secondary text-muted-foreground border-border",
  green:
    "bg-success-subtle text-success border-success/20",
  warning:
    "bg-warning-subtle text-warning border-warning/20",
} as const;

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px] leading-3",
  md: "px-2 py-0.5 text-xs leading-4",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Badge({
  className,
  variant = "gray",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}