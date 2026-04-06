/**
 * SOKDAK Card 컴포넌트
 * docs/design/ui-system.md 기준: radius-lg, shadow-card, hover scale
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly hoverable?: boolean;
}

export function Card({ children, className, hoverable = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-4 shadow-[var(--shadow-card)] transition-all",
        hoverable && "hover:scale-[1.01] hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-3", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("text-base font-semibold leading-snug", className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("text-sm", className)}>{children}</div>;
}
