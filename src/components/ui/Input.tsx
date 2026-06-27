import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Vanta — Input Component
 * Dark surface, copper focus ring, icon slot
 * ───────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "h-10 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-all duration-200",
            "focus:border-copper/50 focus:outline-none focus:ring-2 focus:ring-copper/20",
            "hover:border-border-light",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";