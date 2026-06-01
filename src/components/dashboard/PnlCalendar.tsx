import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { calendarMonthWeeks, tradesOnDate } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import type { Trade } from "@/types/trade";
import { Button } from "@/components/ui/button";
import { DayPnlPreview } from "@/components/dashboard/DayPnlPreview";
import { cn } from "@/lib/utils";

type SelectedDay = {
  date: Date;
  dateKey: string;
  pnl: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatCellPnl(value: number): string {
  if (value === 0) return "—";
  const sign = value > 0 ? "+" : "-";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  }
  if (abs >= 100) return `${sign}$${abs.toFixed(0)}`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function PnlCalendar({ trades }: { trades: Trade[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const weeks = useMemo(
    () => calendarMonthWeeks(viewYear, viewMonth, trades),
    [viewYear, viewMonth, trades],
  );

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthTotal = useMemo(() => {
    let sum = 0;
    for (const week of weeks) {
      for (const day of week.days) {
        if (day.inMonth) sum += day.pnl;
      }
    }
    return Math.round(sum * 100) / 100;
  }, [weeks]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const previewTrades = useMemo(
    () => (selectedDay ? tradesOnDate(trades, selectedDay.dateKey) : []),
    [selectedDay, trades],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[10rem] text-center font-display text-sm font-semibold">{monthLabel}</h3>
          <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p
          className={cn(
            "font-mono text-sm font-semibold",
            monthTotal > 0 && "text-[var(--profit)]",
            monthTotal < 0 && "text-[var(--loss)]",
          )}
        >
          Month: {monthTotal >= 0 ? "+" : ""}
          {formatCurrency(monthTotal)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_minmax(5.5rem,1fr)] gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {d}
              </div>
            ))}
            <div className="pb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Week
            </div>

            {weeks.map((week, wi) => {
              const weekTradeCount = week.days.reduce((sum, d) => sum + d.tradeCount, 0);
              return (
                <Fragment key={wi}>
                {week.days.map((day) => {
                  const isToday =
                    day.date.getDate() === today.getDate() &&
                    day.date.getMonth() === today.getMonth() &&
                    day.date.getFullYear() === today.getFullYear();
                  const hasTrades = day.tradeCount > 0;
                  const positive = day.pnl > 0;
                  const negative = day.pnl < 0;
                  const isSelected = selectedDay?.dateKey === day.dateKey;

                  return (
                    <button
                      type="button"
                      key={`${wi}-${day.dateKey}`}
                      onClick={() =>
                        setSelectedDay({
                          date: day.date,
                          dateKey: day.dateKey,
                          pnl: day.pnl,
                        })
                      }
                      className={cn(
                        "relative flex min-h-[5rem] cursor-pointer flex-col rounded-lg border px-1.5 py-2 text-center transition-colors hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        day.inMonth
                          ? "border-border/50 bg-background/50"
                          : "border-transparent bg-muted/15 opacity-60",
                        isToday && "ring-2 ring-primary/40",
                        isSelected && "ring-2 ring-primary",
                        hasTrades && positive && "border-[color-mix(in_oklab,var(--profit)_35%,transparent)] bg-[color-mix(in_oklab,var(--profit)_8%,transparent)]",
                        hasTrades && negative && "border-[color-mix(in_oklab,var(--loss)_35%,transparent)] bg-[color-mix(in_oklab,var(--loss)_8%,transparent)]",
                      )}
                      title={`${day.date.toLocaleDateString("en-US")} · ${day.tradeCount} trade(s) · ${formatCurrency(day.pnl)}`}
                    >
                      <span
                        className={cn(
                          "absolute left-2 top-1.5 text-[11px] font-semibold leading-none tabular-nums",
                          day.inMonth ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                      <div className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-3">
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold leading-tight",
                            !hasTrades && "text-muted-foreground/50",
                            positive && "text-[var(--profit)]",
                            negative && "text-[var(--loss)]",
                          )}
                        >
                          {formatCellPnl(day.pnl)}
                        </span>
                        {hasTrades && (
                          <span className="whitespace-nowrap text-[9px] font-medium leading-none text-muted-foreground/90">
                            {day.tradeCount} {day.tradeCount === 1 ? "trade" : "trades"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <div
                  className={cn(
                    "flex min-h-[5rem] flex-col items-center justify-center gap-0.5 rounded-lg border border-border/60 bg-muted/25 px-2 py-2",
                    week.weekPnl > 0 && "border-[color-mix(in_oklab,var(--profit)_40%,transparent)] bg-[color-mix(in_oklab,var(--profit)_12%,transparent)]",
                    week.weekPnl < 0 && "border-[color-mix(in_oklab,var(--loss)_40%,transparent)] bg-[color-mix(in_oklab,var(--loss)_12%,transparent)]",
                  )}
                  title={`${week.weekLabel} · ${weekTradeCount} trade(s) · ${formatCurrency(week.weekPnl)}`}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs font-bold leading-tight",
                      week.weekPnl > 0 && "text-[var(--profit)]",
                      week.weekPnl < 0 && "text-[var(--loss)]",
                      week.weekPnl === 0 && "text-muted-foreground",
                    )}
                  >
                    {week.weekPnl >= 0 ? "+" : ""}
                    {formatCurrency(week.weekPnl)}
                  </span>
                  {weekTradeCount > 0 && (
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {weekTradeCount} {weekTradeCount === 1 ? "trade" : "trades"}
                    </span>
                  )}
                </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tap a day to preview trades. Daily P&L uses entry date; the week column sums Sunday–Saturday per row.
      </p>

      <DayPnlPreview
        open={selectedDay !== null}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        date={selectedDay?.date ?? null}
        trades={previewTrades}
        dayPnl={selectedDay?.pnl ?? 0}
      />
    </div>
  );
}
