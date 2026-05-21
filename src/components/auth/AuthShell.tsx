import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CandlestickChart } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 grid-bg opacity-[0.15]" />
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
            <CandlestickChart className="h-6 w-6" />
          </div>
          <div className="font-display text-xl font-semibold tracking-tight">Edgebook</div>
        </Link>

        <div className="glass-strong rounded-3xl p-8 shadow-soft">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/60";
export const authLabelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground";
export const authButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:opacity-60";
