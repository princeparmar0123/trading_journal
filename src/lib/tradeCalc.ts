import type { TradeResult } from "@/types/trade";

export function deriveResult(pnl: number): TradeResult {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

export function resolveExitPrice(trade: { exitPrice?: number; entryPrice: number }): number {
  return trade.exitPrice ?? trade.entryPrice;
}

export function resolveExitTradedAt(trade: {
  exitTradedAt?: number;
  tradedAt: number;
}): number {
  return trade.exitTradedAt ?? trade.tradedAt;
}
