import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Minus, Plus } from "lucide-react";

import { deriveResult } from "@/lib/tradeCalc";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Trade } from "@/types/trade";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function DayPnlPreview({
  open,
  onOpenChange,
  date,
  trades,
  dayPnl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  trades: Trade[];
  dayPnl: number;
}) {
  if (!date) return null;

  const wins = trades.filter((t) => deriveResult(t.pnl) === "win").length;
  const losses = trades.filter((t) => deriveResult(t.pnl) === "loss").length;
  const breakevens = trades.filter((t) => deriveResult(t.pnl) === "breakeven").length;
  const positive = dayPnl > 0;
  const negative = dayPnl < 0;

  const title = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-lg gap-0 overflow-hidden p-0">
        <div
          className={cn(
            "border-b px-6 py-5",
            positive && "bg-[color-mix(in_oklab,var(--profit)_10%,transparent)]",
            negative && "bg-[color-mix(in_oklab,var(--loss)_10%,transparent)]",
            !positive && !negative && "bg-muted/20",
          )}
        >
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-display text-lg leading-tight">{title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {trades.length === 0
                    ? "No trades logged on this day"
                    : `${trades.length} trade${trades.length === 1 ? "" : "s"} · ${wins}W ${losses}L${breakevens ? ` ${breakevens}BE` : ""}`}
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Net P&L
                </p>
                <p
                  className={cn(
                    "font-display text-3xl font-bold tracking-tight",
                    positive && "text-[var(--profit)]",
                    negative && "text-[var(--loss)]",
                    !positive && !negative && "text-muted-foreground",
                  )}
                >
                  {dayPnl >= 0 ? "+" : ""}
                  {formatCurrency(dayPnl)}
                </p>
              </div>
              {trades.length > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] px-2.5 py-1 font-semibold text-[var(--profit)]">
                    {wins} wins
                  </span>
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] px-2.5 py-1 font-semibold text-[var(--loss)]">
                    {losses} losses
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[min(50vh,400px)] overflow-y-auto px-6 py-4">
          {trades.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border/60 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No activity</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                You did not log any trades on this date. Pick another day or add a trade for this session.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/trades/new" onClick={() => onOpenChange(false)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Log trade
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {trades.map((t) => {
                const result = deriveResult(t.pnl);
                const tradePositive = t.pnl > 0;
                const tradeNegative = t.pnl < 0;
                return (
                  <li key={t.id}>
                    <Link
                      to="/trades/$tradeId"
                      params={{ tradeId: t.id }}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/40"
                    >
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                          tradePositive && "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
                          tradeNegative && "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                          !tradePositive && !tradeNegative && "bg-muted text-muted-foreground",
                        )}
                      >
                        {tradePositive ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : tradeNegative ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{t.pair}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t.direction}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                              result === "win" && "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
                              result === "loss" && "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                              result === "breakeven" && "bg-muted text-muted-foreground",
                            )}
                          >
                            {result}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {formatDateTime(t.tradedAt)}
                          {t.strategy ? ` · ${t.strategy}` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm font-semibold",
                          tradePositive && "text-[var(--profit)]",
                          tradeNegative && "text-[var(--loss)]",
                        )}
                      >
                        {tradePositive ? "+" : ""}
                        {formatCurrency(t.pnl)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {trades.length > 0 && (
          <div className="border-t border-border/50 px-6 py-3">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/trades" onClick={() => onOpenChange(false)}>
                View all trades
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
