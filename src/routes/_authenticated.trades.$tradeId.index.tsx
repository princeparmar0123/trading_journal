import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { deleteTrade, getTrade } from "@/services/trades";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { useScreenshotModal } from "@/components/trades/ScreenshotModal";
import { deriveResult, resolveExitPrice, resolveExitTradedAt } from "@/lib/tradeCalc";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/_authenticated/trades/$tradeId/")({
  component: TradeDetailPage,
});

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/40 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1.5 text-sm font-medium", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function TradeDetailPage() {
  const { tradeId } = Route.useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const screenshot = useScreenshotModal();

  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade", tradeId],
    queryFn: () => getTrade(tradeId),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!trade) return (
    <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
      <p className="text-sm text-muted-foreground">Trade not found.</p>
      <Link to="/trades" className="mt-3 inline-flex text-sm text-primary hover:underline">Back to trades</Link>
    </div>
  );

  const exitPrice = resolveExitPrice(trade);
  const exitTradedAt = resolveExitTradedAt(trade);
  const result = deriveResult(trade.pnl);
  const positive = trade.pnl > 0;
  const negative = trade.pnl < 0;

  const handleDelete = async () => {
    if (!confirm("Delete this trade?")) return;
    try {
      await deleteTrade(trade.id);
      toast.success("Trade deleted");
      queryClient.invalidateQueries({ queryKey: ["trades", user?.uid] });
      navigate({ to: "/trades" });
    } catch (err) {
      toast.error("Delete failed", { description: err instanceof Error ? err.message : "" });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/trades" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to trades
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/trades/$tradeId/edit"
            params={{ tradeId: trade.id }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <header className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/50 p-6 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "grid h-14 w-14 place-items-center rounded-2xl font-mono text-sm font-bold",
                trade.direction === "buy"
                  ? "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]"
                  : "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
              )}
            >
              {trade.direction === "buy" ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">{trade.pair}</h1>
              <p className="text-sm capitalize text-muted-foreground">
                {trade.direction} · Entry {formatDateTime(trade.tradedAt)}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div
              className={cn(
                "font-display text-3xl font-bold tracking-tight",
                positive && "text-[var(--profit)]",
                negative && "text-[var(--loss)]",
              )}
            >
              {positive ? "+" : ""}
              {formatCurrency(trade.pnl)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:justify-end">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  result === "win" && "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
                  result === "loss" && "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                  result === "breakeven" && "bg-muted text-muted-foreground",
                )}
              >
                {result}
              </span>
              <span className="text-xs text-muted-foreground">{formatNumber(trade.rrRatio, 2)}R</span>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Execution
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Entry price" value={trade.entryPrice} mono />
          <Field label="Exit price" value={exitPrice} mono />
          <Field label="Entry date & time" value={formatDateTime(trade.tradedAt)} />
          <Field label="Exit date & time" value={formatDateTime(exitTradedAt)} />
          <Field label="Lot size" value={trade.lotSize} mono />
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Chart
        </h2>
        {trade.screenshotUrl ? (
          <button
            type="button"
            onClick={() => screenshot.open(trade.screenshotUrl!)}
            className="flex min-h-48 max-h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/15 transition-transform hover:scale-[1.01]"
          >
            <img
              src={trade.screenshotUrl}
              alt="Trade chart"
              className="max-h-96 w-full object-contain object-center"
            />
          </button>
        ) : (
          <div className="grid h-48 place-items-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
            No chart image
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Setup & risk
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Risk %" value={`${trade.riskPercent}%`} mono />
          <Field label="RR" value={`${formatNumber(trade.rrRatio, 2)}R`} mono />
          <Field label="Strategy" value={trade.strategy || "—"} />
          <Field label="Session" value={<span className="capitalize">{trade.session}</span>} />
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Psychology & review
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Emotion" value={trade.emotionBefore || "—"} />
          <Field label="Lesson learned" value={trade.lesson || "—"} />
          <div className="sm:col-span-2">
            <Field label="Pre trade review" value={trade.preTradeReview || "—"} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Post trade review" value={trade.postTradeReview || "—"} />
          </div>
          {trade.notes && (
            <div className="sm:col-span-2">
              <Field label="Notes" value={trade.notes} />
            </div>
          )}
        </div>
      </section>

      {screenshot.node}
    </div>
  );
}
