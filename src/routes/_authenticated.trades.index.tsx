import { useRef, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Download,
  Upload,
  Loader2,
  ListOrdered,
  Target,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/store/auth";
import { parseTradesCsv } from "@/lib/csvImport";
import { listTrades, deleteTrade, importTrades } from "@/services/trades";
import { computeStats, exportTradesCsv } from "@/lib/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { TradeTable } from "@/components/trades/TradeTable";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trades/")({
  component: TradesPage,
});

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "profit" | "loss" | "default";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3">
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          tone === "profit" && "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
          tone === "loss" && "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
          (!tone || tone === "default") && "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function TradesPage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const { data: trades = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trades", user?.uid],
    queryFn: () => listTrades(user!.uid),
    enabled: !!user,
  });

  const stats = useMemo(() => computeStats(trades), [trades]);
  const pnlPositive = stats.totalPnl > 0;
  const pnlNegative = stats.totalPnl < 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteTrade(id);
      toast.success("Trade deleted");
      queryClient.setQueryData(["trades", user?.uid], (old: typeof trades | undefined) =>
        (old ?? []).filter((t) => t.id !== id),
      );
    } catch (err) {
      toast.error("Delete failed", { description: err instanceof Error ? err.message : "" });
    }
  };

  const handleExport = () => {
    if (trades.length === 0) {
      toast.info("No trades to export");
      return;
    }
    const csv = exportTradesCsv(trades);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edgebook-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a .csv file");
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const { trades: parsed, errors, skipped } = parseTradesCsv(text);

      if (parsed.length === 0) {
        toast.error("No trades to import", {
          description: errors[0]?.message ?? "Check your CSV columns and data",
        });
        return;
      }

      const count = await importTrades(user.uid, parsed);
      await queryClient.invalidateQueries({ queryKey: ["trades", user.uid] });

      if (errors.length > 0) {
        toast.warning(`Imported ${count} trades`, {
          description: `${errors.length} row(s) skipped. ${skipped ? `${skipped} empty rows ignored.` : ""}`,
        });
      } else {
        toast.success(`Imported ${count} trades`, {
          description: skipped ? `${skipped} empty rows ignored` : undefined,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Import failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card/80 to-card/40 p-6 shadow-soft sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trade log
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              All trades
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Search, filter, import CSV, or export your full trading history.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImportFile(f);
              }}
            />
            <button
              type="button"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-accent disabled:opacity-60"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import CSV
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <Link
              to="/trades/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New trade
            </Link>
          </div>
        </div>
      </header>

      {isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <p className="text-sm font-medium text-destructive">Could not load trades</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Check Firestore is enabled and security rules allow read/write."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-xl border border-border bg-card/60 px-4 py-2 text-sm hover:bg-accent"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-14 rounded-2xl" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <EmptyState
          title="No trades logged yet"
          description="Import a CSV from TradeFXBook or add your first trade manually."
          actionLabel="Add trade"
          actionTo="/trades/new"
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat
              label="Total trades"
              value={stats.totalTrades}
              icon={<ListOrdered className="h-4 w-4" />}
            />
            <MiniStat
              label="Net P&L"
              value={
                <span
                  className={cn(
                    pnlPositive && "text-[var(--profit)]",
                    pnlNegative && "text-[var(--loss)]",
                  )}
                >
                  {stats.totalPnl >= 0 ? "+" : ""}
                  {formatCurrency(stats.totalPnl)}
                </span>
              }
              icon={<Wallet className="h-4 w-4" />}
              tone={pnlPositive ? "profit" : pnlNegative ? "loss" : "default"}
            />
            <MiniStat
              label="Win rate"
              value={`${formatNumber(stats.winRate, 1)}%`}
              icon={<Target className="h-4 w-4" />}
              tone="default"
            />
          </div>

          <TradeTable trades={trades} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
