import type { Trade, TradeSession } from "@/types/trade";
import { deriveResult } from "@/lib/tradeCalc";
import { formatNumber } from "@/lib/format";

function tradeResult(t: Trade) {
  return t.result ?? deriveResult(t.pnl);
}

export interface Stats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  bestStrategy: string;
  currentStreak: number;
  streakType: "win" | "loss" | "none";
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
  avgRiskPercent: number;
  tradesThisMonth: number;
  pnlThisMonth: number;
  bestSession: string;
  bestPair: string;
  longestWinStreak: number;
  grossProfit: number;
  grossLoss: number;
  buyTrades: number;
  sellTrades: number;
  buyWinRate: number;
  sellWinRate: number;
}

function winRateFor(trades: Trade[]): number {
  const wins = trades.filter((t) => tradeResult(t) === "win").length;
  const losses = trades.filter((t) => tradeResult(t) === "loss").length;
  const decided = wins + losses;
  return decided > 0 ? (wins / decided) * 100 : 0;
}

function bestByPnl(
  trades: Trade[],
  key: (t: Trade) => string,
): string {
  const map = new Map<string, number>();
  for (const t of trades) {
    const k = key(t);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + t.pnl);
  }
  let best = "—";
  let bestPnl = -Infinity;
  for (const [name, pnl] of map) {
    if (pnl > bestPnl) {
      bestPnl = pnl;
      best = name;
    }
  }
  return best;
}

function longestStreak(trades: Trade[], type: "win" | "loss"): number {
  const ordered = [...trades].sort((a, b) => a.tradedAt - b.tradedAt);
  let max = 0;
  let current = 0;
  for (const t of ordered) {
    const r = tradeResult(t);
    if (r === type) {
      current += 1;
      max = Math.max(max, current);
    } else if (r !== "breakeven") {
      current = 0;
    }
  }
  return max;
}

export function computeStats(trades: Trade[]): Stats {
  const totalTrades = trades.length;
  const wins = trades.filter((t) => tradeResult(t) === "win").length;
  const losses = trades.filter((t) => tradeResult(t) === "loss").length;
  const breakevens = trades.filter((t) => tradeResult(t) === "breakeven").length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const decided = wins + losses;
  const winRate = decided > 0 ? (wins / decided) * 100 : 0;
  const avgRR =
    totalTrades > 0
      ? trades.reduce((s, t) => s + (Number.isFinite(t.rrRatio) ? t.rrRatio : 0), 0) / totalTrades
      : 0;

  const winningTrades = trades.filter((t) => tradeResult(t) === "win");
  const losingTrades = trades.filter((t) => tradeResult(t) === "loss");
  const grossProfit = winningTrades.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((s, t) => s + t.pnl, 0));
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const pnls = trades.map((t) => t.pnl);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
  const avgRiskPercent =
    totalTrades > 0 ? trades.reduce((s, t) => s + t.riskPercent, 0) / totalTrades : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thisMonth = trades.filter((t) => t.tradedAt >= monthStart);
  const tradesThisMonth = thisMonth.length;
  const pnlThisMonth = thisMonth.reduce((s, t) => s + t.pnl, 0);

  const buyTrades = trades.filter((t) => t.direction === "buy");
  const sellTrades = trades.filter((t) => t.direction === "sell");

  const ordered = [...trades].sort((a, b) => b.tradedAt - a.tradedAt);
  let streak = 0;
  let streakType: "win" | "loss" | "none" = "none";
  for (const t of ordered) {
    const r = tradeResult(t);
    if (r === "breakeven") continue;
    if (streakType === "none") {
      streakType = r;
      streak = 1;
      continue;
    }
    if (r === streakType) streak += 1;
    else break;
  }

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate,
    totalPnl,
    avgRR,
    bestStrategy: bestByPnl(trades, (t) => t.strategy),
    currentStreak: streak,
    streakType,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    bestTrade,
    worstTrade,
    avgRiskPercent,
    tradesThisMonth,
    pnlThisMonth,
    bestSession: bestByPnl(trades, (t) => t.session),
    bestPair: bestByPnl(trades, (t) => t.pair),
    longestWinStreak: longestStreak(trades, "win"),
    grossProfit,
    grossLoss,
    buyTrades: buyTrades.length,
    sellTrades: sellTrades.length,
    buyWinRate: winRateFor(buyTrades),
    sellWinRate: winRateFor(sellTrades),
  };
}

export function equityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const ordered = [...trades].sort((a, b) => a.tradedAt - b.tradedAt);
  let equity = 0;
  return ordered.map((t) => {
    equity += t.pnl;
    return {
      date: new Date(t.tradedAt).toISOString().slice(0, 10),
      equity: Math.round(equity * 100) / 100,
    };
  });
}

export function monthlyPnl(trades: Trade[]): { month: string; pnl: number }[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const d = new Date(t.tradedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + t.pnl);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }));
}

export interface SessionStat {
  session: TradeSession;
  label: string;
  pnl: number;
  trades: number;
  winRate: number;
}

const SESSION_LABELS: Record<TradeSession, string> = {
  asian: "Asian",
  london: "London",
  newyork: "New York",
  overlap: "Overlap",
};

export function sessionBreakdown(trades: Trade[]): SessionStat[] {
  const sessions: TradeSession[] = ["asian", "london", "newyork", "overlap"];
  return sessions
    .map((session) => {
      const subset = trades.filter((t) => t.session === session);
      return {
        session,
        label: SESSION_LABELS[session],
        pnl: subset.reduce((s, t) => s + t.pnl, 0),
        trades: subset.length,
        winRate: winRateFor(subset),
      };
    })
    .filter((s) => s.trades > 0)
    .sort((a, b) => b.pnl - a.pnl);
}

export interface PairStat {
  pair: string;
  pnl: number;
  trades: number;
  winRate: number;
}

export function topPairs(trades: Trade[], limit = 5): PairStat[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const list = map.get(t.pair) ?? [];
    list.push(t);
    map.set(t.pair, list);
  }
  return Array.from(map.entries())
    .map(([pair, subset]) => ({
      pair,
      pnl: subset.reduce((s, t) => s + t.pnl, 0),
      trades: subset.length,
      winRate: winRateFor(subset),
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, limit);
}

export function recentTrades(trades: Trade[], limit = 5): Trade[] {
  return [...trades].sort((a, b) => b.tradedAt - a.tradedAt).slice(0, limit);
}

export function formatProfitFactor(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (value === 0) return "0";
  return formatNumber(value, 2);
}

export function exportTradesCsv(trades: Trade[]): string {
  const headers = [
    "tradedAt", "pair", "direction", "entryPrice", "stopLoss", "takeProfit",
    "lotSize", "riskPercent", "result", "pnl", "rrRatio", "strategy", "session",
    "trend", "emotionBefore", "preTradeReview", "postTradeReview", "lesson", "notes",
  ];
  const rows = trades.map((t) =>
    [
      new Date(t.tradedAt).toISOString(),
      t.pair, t.direction, t.entryPrice, t.stopLoss, t.takeProfit,
      t.lotSize, t.riskPercent, t.result, t.pnl, t.rrRatio, t.strategy, t.session,
      t.trend, t.emotionBefore, t.preTradeReview ?? "", t.postTradeReview ?? "", t.lesson, t.notes,
    ]
      .map((v) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes("\"") || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}
