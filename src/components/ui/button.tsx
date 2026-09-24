import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "bg-card-2 text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
  ghost: "text-muted hover:bg-card-2 hover:text-foreground",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
} as const;

const sizes = {
  default: "h-12 px-4",
  sm: "h-12 px-4 text-sm",
  lg: "h-12 px-4",
  icon: "size-12",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  tooltip?: string;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", tooltip, title, disabled, ...props }, ref) => {
    const label = title || tooltip || (typeof props["aria-label"] === "string" ? props["aria-label"] : undefined);
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)] disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        disabled={disabled}
        title={label}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
