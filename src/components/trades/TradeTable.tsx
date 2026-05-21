import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  Search,
  ImageIcon,
  ArrowDown,
  ArrowUp,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Trade } from "@/types/trade";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { deriveResult } from "@/lib/tradeCalc";
import { cn } from "@/lib/utils";
import { useScreenshotModal } from "./ScreenshotModal";

type SortKey = "tradedAt" | "pair" | "pnl" | "rrRatio" | "strategy";

interface Props {
  trades: Trade[];
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 10;

const selectClass =
  "rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export function TradeTable({ trades, onDelete }: Props) {
  const [q, setQ] = useState("");
  const [pair, setPair] = useState<string>("all");
  const [strategy, setStrategy] = useState<string>("all");
  const [session, setSession] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("tradedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const screenshot = useScreenshotModal();

  const pairs = useMemo(() => Array.from(new Set(trades.map((t) => t.pair))).sort(), [trades]);
  const strategies = useMemo(
    () => Array.from(new Set(trades.map((t) => t.strategy).filter(Boolean))).sort(),
    [trades],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return trades.filter((t) => {
      if (pair !== "all" && t.pair !== pair) return false;
      if (strategy !== "all" && t.strategy !== strategy) return false;
      if (session !== "all" && t.session !== session) return false;
      if (!ql) return true;
      return (
        t.pair.toLowerCase().includes(ql) ||
        t.strategy.toLowerCase().includes(ql) ||
        t.notes.toLowerCase().includes(ql)
      );
    });
  }, [trades, q, pair, strategy, session]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilters =
    (pair !== "all" ? 1 : 0) + (strategy !== "all" ? 1 : 0) + (session !== "all" ? 1 : 0) + (q.trim() ? 1 : 0);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const Th = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th
      className={cn(
        "px-4 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
        align === "right" && "text-right",
      )}
    >
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          "inline-flex items-center gap-1 transition hover:text-foreground",
          sortKey === k && "text-foreground",
        )}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sortKey === k ? "opacity-100" : "opacity-40")} />
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/40 p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilters > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
              {activeFilters} active
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search pair, strategy, notes…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border/60 bg-background/70 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={pair}
            onChange={(e) => {
              setPair(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All pairs</option>
            {pairs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={strategy}
            onChange={(e) => {
              setStrategy(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All strategies</option>
            {strategies.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={session}
            onChange={(e) => {
              setSession(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All sessions</option>
            <option value="asian">Asian</option>
            <option value="london">London</option>
            <option value="newyork">New York</option>
            <option value="overlap">Overlap</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/40 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border/50 bg-background/40">
                <Th k="tradedAt" label="Date" />
                <Th k="pair" label="Pair" />
                <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Result
                </th>
                <Th k="pnl" label="P&L" align="right" />
                <Th k="rrRatio" label="RR" align="right" />
                <Th k="strategy" label="Strategy" />
                <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Session
                </th>
                <th className="px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-20 text-center">
                    <p className="text-sm font-medium text-muted-foreground">No trades match your filters</p>
                    <p className="mt-1 text-xs text-muted-foreground/80">Try clearing search or filters</p>
                  </td>
                </tr>
              )}
              {paged.map((t) => {
                const positive = t.pnl > 0;
                const negative = t.pnl < 0;
                const result = deriveResult(t.pnl);
                return (
                  <tr
                    key={t.id}
                    className="group transition-colors hover:bg-accent/25"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted-foreground">
                      {formatDate(t.tradedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to="/trades/$tradeId"
                        params={{ tradeId: t.id }}
                        className="font-mono text-sm font-semibold hover:text-primary"
                      >
                        {t.pair}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold",
                          t.direction === "buy"
                            ? "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]"
                            : "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                        )}
                      >
                        {t.direction === "buy" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {t.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                          result === "win" &&
                            "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
                          result === "loss" &&
                            "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                          result === "breakeven" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {result}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-4 py-3.5 text-right font-mono text-sm font-semibold",
                        positive && "text-[var(--profit)]",
                        negative && "text-[var(--loss)]",
                      )}
                    >
                      {positive ? "+" : ""}
                      {formatCurrency(t.pnl)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-muted-foreground">
                      {formatNumber(t.rrRatio, 2)}R
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3.5 text-sm">
                      {t.strategy || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm capitalize text-muted-foreground">{t.session}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-0.5 opacity-90 transition group-hover:opacity-100">
                        {t.screenshotUrl && (
                          <button
                            type="button"
                            onClick={() => screenshot.open(t.screenshotUrl!)}
                            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            aria-label="View screenshot"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          to="/trades/$tradeId"
                          params={{ tradeId: t.id }}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/trades/$tradeId/edit"
                          params={{ tradeId: t.id }}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-primary"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this trade? This cannot be undone.")) onDelete(t.id);
                          }}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-background/30 px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {sorted.length === 0
              ? "0 trades"
              : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sorted.length)} of ${sorted.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="px-2 text-xs font-medium text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-accent"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {screenshot.node}
    </div>
  );
}
