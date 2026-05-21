import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Target,
  Trophy,
  Flame,
  BarChart3,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  PieChart,
  Clock,
  Zap,
} from "lucide-react";

import { useAuth } from "@/store/auth";
import { listTrades } from "@/services/trades";
import {
  computeStats,
  equityCurve,
  monthlyPnl,
  sessionBreakdown,
  topPairs,
  recentTrades,
  formatProfitFactor,
} from "@/lib/analytics";
import { deriveResult } from "@/lib/tradeCalc";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { WinLossPie } from "@/components/dashboard/WinLossPie";
import { MonthlyBar } from "@/components/dashboard/MonthlyBar";
import { SessionBar } from "@/components/dashboard/SessionBar";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const SESSION_DISPLAY: Record<string, string> = {
  asian: "Asian",
  london: "London",
  newyork: "New York",
  overlap: "Overlap",
};

function ChartPanel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/40 p-5 shadow-soft",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function DashboardPage() {
  const user = useAuth((s) => s.user);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", user?.uid],
    queryFn: () => listTrades(user!.uid),
    enabled: !!user,
  });

  const stats = useMemo(() => computeStats(trades), [trades]);
  const equity = useMemo(() => equityCurve(trades), [trades]);
  const monthly = useMemo(() => monthlyPnl(trades), [trades]);
  const sessions = useMemo(() => sessionBreakdown(trades), [trades]);
  const pairs = useMemo(() => topPairs(trades, 5), [trades]);
  const recent = useMemo(() => recentTrades(trades, 6), [trades]);

  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const pnlPositive = stats.totalPnl > 0;
  const pnlNegative = stats.totalPnl < 0;
  const monthPnlPositive = stats.pnlThisMonth > 0;
  const monthPnlNegative = stats.pnlThisMonth < 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <EmptyState
        title="No trades yet"
        description="Log your first trade to unlock performance stats, equity curves, and session insights."
        actionLabel="Log first trade"
        actionTo="/trades/new"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card/80 to-card/40 p-6 shadow-soft sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-[var(--profit)]/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Performance overview
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Trading dashboard
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {stats.totalTrades} trades logged · {monthLabel}:{" "}
              <span
                className={cn(
                  "font-medium",
                  monthPnlPositive && "text-[var(--profit)]",
                  monthPnlNegative && "text-[var(--loss)]",
                )}
              >
                {stats.pnlThisMonth >= 0 ? "+" : ""}
                {formatCurrency(stats.pnlThisMonth)}
              </span>{" "}
              ({stats.tradesThisMonth} this month)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-left lg:text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Net P&L
              </p>
              <p
                className={cn(
                  "font-display text-4xl font-bold tracking-tight sm:text-5xl",
                  pnlPositive && "text-[var(--profit)]",
                  pnlNegative && "text-[var(--loss)]",
                )}
              >
                {stats.totalPnl >= 0 ? "+" : ""}
                {formatCurrency(stats.totalPnl)}
              </p>
            </div>
            <Link
              to="/trades/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Log trade
            </Link>
          </div>
        </div>
      </header>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Win rate"
          value={`${formatNumber(stats.winRate, 1)}%`}
          hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`}
          icon={<Target className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Profit factor"
          value={formatProfitFactor(stats.profitFactor)}
          hint={`${formatCurrency(stats.grossProfit)} gross wins`}
          icon={<Scale className="h-5 w-5" />}
          tone={stats.profitFactor >= 1 ? "profit" : "loss"}
        />
        <StatCard
          label="Expectancy"
          value={
            <span
              className={cn(
                stats.expectancy > 0 && "text-[var(--profit)]",
                stats.expectancy < 0 && "text-[var(--loss)]",
              )}
            >
              {stats.expectancy >= 0 ? "+" : ""}
              {formatCurrency(stats.expectancy)}
            </span>
          }
          hint="Avg P&L per trade"
          icon={<BarChart3 className="h-5 w-5" />}
          tone={stats.expectancy >= 0 ? "profit" : "loss"}
        />
        <StatCard
          label="Avg R:R"
          value={`${formatNumber(stats.avgRR, 2)}R`}
          hint="Across all trades"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          size="compact"
          label="Avg win"
          value={<span className="text-[var(--profit)]">{formatCurrency(stats.avgWin)}</span>}
          icon={<ArrowUpRight className="h-4 w-4" />}
          tone="profit"
        />
        <StatCard
          size="compact"
          label="Avg loss"
          value={<span className="text-[var(--loss)]">{formatCurrency(stats.avgLoss)}</span>}
          icon={<ArrowDownRight className="h-4 w-4" />}
          tone="loss"
        />
        <StatCard
          size="compact"
          label="Best trade"
          value={<span className="text-[var(--profit)]">{formatCurrency(stats.bestTrade)}</span>}
          hint="Single trade high"
          icon={<Zap className="h-4 w-4" />}
          tone="profit"
        />
        <StatCard
          size="compact"
          label="Worst trade"
          value={<span className="text-[var(--loss)]">{formatCurrency(stats.worstTrade)}</span>}
          hint="Single trade low"
          icon={<TrendingDown className="h-4 w-4" />}
          tone="loss"
        />
        <StatCard
          size="compact"
          label="Longest win streak"
          value={String(stats.longestWinStreak)}
          hint={`Current: ${stats.currentStreak} ${stats.streakType !== "none" ? stats.streakType + "s" : ""}`.trim()}
          icon={<Flame className="h-4 w-4" />}
          tone="profit"
        />
        <StatCard
          size="compact"
          label="Avg risk %"
          value={`${formatNumber(stats.avgRiskPercent, 1)}%`}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          size="compact"
          label="Buy win rate"
          value={`${formatNumber(stats.buyWinRate, 1)}%`}
          hint={`${stats.buyTrades} buy trades`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          size="compact"
          label="Sell win rate"
          value={`${formatNumber(stats.sellWinRate, 1)}%`}
          hint={`${stats.sellTrades} sell trades`}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      {/* Insights row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Best strategy"
          value={stats.bestStrategy}
          hint="Highest net P&L"
          icon={<Trophy className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Best session"
          value={SESSION_DISPLAY[stats.bestSession] ?? stats.bestSession}
          hint="Highest net P&L"
          icon={<Clock className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Top pair"
          value={stats.bestPair}
          hint="Highest net P&L"
          icon={<PieChart className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      {/* Equity */}
      <ChartPanel
        title="Equity curve"
        subtitle={`Cumulative ${stats.totalPnl >= 0 ? "+" : ""}${formatCurrency(stats.totalPnl)} · ${stats.totalTrades} trades`}
      >
        <EquityChart data={equity} />
      </ChartPanel>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartPanel title="Wins vs losses" className="lg:col-span-2">
          <WinLossPie wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
        </ChartPanel>
        <ChartPanel title="Monthly P&L" subtitle="Performance by month" className="lg:col-span-3">
          <MonthlyBar data={monthly} />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Session performance" subtitle="Net P&L by trading session">
          <SessionBar
            data={sessions.map((s) => ({ label: s.label, pnl: s.pnl, trades: s.trades }))}
          />
        </ChartPanel>

        {/* Top pairs */}
        <section className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/40 p-5 shadow-soft">
          <h2 className="font-display text-sm font-semibold tracking-tight">Top pairs</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">By net P&L</p>
          <ul className="mt-4 space-y-2">
            {pairs.map((p, i) => (
              <li
                key={p.pair}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold">{p.pair}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.trades} trades · {formatNumber(p.winRate, 0)}% win
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold",
                    p.pnl > 0 && "text-[var(--profit)]",
                    p.pnl < 0 && "text-[var(--loss)]",
                  )}
                >
                  {p.pnl >= 0 ? "+" : ""}
                  {formatCurrency(p.pnl)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recent trades */}
      <section className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/40 p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-tight">Recent trades</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest activity</p>
          </div>
          <Link
            to="/trades"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 pr-4">Pair</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Direction</th>
                <th className="pb-3 pr-4">Result</th>
                <th className="pb-3 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => {
                const result = deriveResult(t.pnl);
                const positive = t.pnl > 0;
                const negative = t.pnl < 0;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border/30 last:border-0 hover:bg-accent/30"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        to="/trades/$tradeId"
                        params={{ tradeId: t.id }}
                        className="font-mono font-semibold hover:text-primary"
                      >
                        {t.pair}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatDate(t.tradedAt)}</td>
                    <td className="py-3 pr-4 capitalize">{t.direction}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          result === "win" && "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
                          result === "loss" && "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                          result === "breakeven" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {result}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-3 text-right font-mono font-semibold",
                        positive && "text-[var(--profit)]",
                        negative && "text-[var(--loss)]",
                      )}
                    >
                      {positive ? "+" : ""}
                      {formatCurrency(t.pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}