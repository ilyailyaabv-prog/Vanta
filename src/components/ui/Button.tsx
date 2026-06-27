import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — Button Component
 * Variants: primary (copper), secondary, ghost
 * Sizes: sm, md, lg
 * ───────────────────────────────────────────── */

const variants = {
  primary:
    "bg-copper text-copper-foreground hover:bg-copper-light active:bg-copper-dark shadow-sm hover:shadow-md hover:shadow-copper/10",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground border border-border",
  ghost:
    "text-muted-foreground hover:text-foreground hover:bg-accent",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asDiv?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asDiv, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center font-medium",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50",
      variants[variant],
      sizes[size],
      className,
    );

    if (asDiv) {
      return <div className={classes}>{children}</div>;
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";