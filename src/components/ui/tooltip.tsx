import type { ReactElement, ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return children;
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <span className="lk-tip inline-flex" data-tip={label}>
      {children}
    </span>
  );
}
