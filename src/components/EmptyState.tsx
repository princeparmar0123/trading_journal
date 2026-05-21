import { Link, type LinkProps } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon = <Inbox className="h-6 w-6" />,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: LinkProps["to"];
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
