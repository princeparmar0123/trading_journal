import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  size = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "profit" | "loss" | "primary";
  size?: "default" | "compact";
  className?: string;
}) {
  const toneRing: Record<string, string> = {
    default: "ring-border/40",
    profit: "ring-[color-mix(in_oklab,var(--profit)_35%,transparent)]",
    loss: "ring-[color-mix(in_oklab,var(--loss)_35%,transparent)]",
    primary: "ring-[color-mix(in_oklab,var(--primary)_35%,transparent)]",
  };
  const toneIconBg: Record<string, string> = {
    default: "bg-accent/40 text-foreground/70",
    profit: "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
    loss: "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
    primary: "bg-primary/15 text-primary",
  };

  const compact = size === "compact";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card/60 shadow-soft ring-1 transition-all hover:-translate-y-0.5 hover:bg-card/80",
        compact ? "p-4" : "p-5",
        toneRing[tone],
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] blur-2xl",
          tone === "profit" && "bg-[var(--profit)]",
          tone === "loss" && "bg-[var(--loss)]",
          tone === "primary" && "bg-primary",
          tone === "default" && "bg-primary",
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div
            className={cn(
              "mt-1.5 truncate font-display font-semibold tracking-tight",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "grid shrink-0 place-items-center rounded-xl",
              compact ? "h-9 w-9" : "h-10 w-10",
              toneIconBg[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
