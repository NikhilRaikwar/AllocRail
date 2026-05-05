import * as React from "react";
import { cn } from "@/app/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success";
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-foreground text-background",
  secondary: "bg-accent text-accent-foreground",
  outline: "border border-border bg-background/60 text-foreground/75",
  success:
    "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
