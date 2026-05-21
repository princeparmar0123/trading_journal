export type TradeDirection = "buy" | "sell";
export type TradeResult = "win" | "loss" | "breakeven";
export type TradeSession = "asian" | "london" | "newyork" | "overlap";
export type TradeTrend = "bullish" | "bearish" | "ranging";

export interface Trade {
  id: string;
  userId: string;
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  riskPercent: number;
  result: TradeResult;
  pnl: number;
  rrRatio: number;
  strategy: string;
  session: TradeSession;
  trend?: TradeTrend;
  emotionBefore: string;
  emotionAfter?: string;
  mistake?: string;
  preTradeReview?: string;
  postTradeReview?: string;
  lesson: string;
  screenshotUrl: string | null;
  notes: string;
  tradedAt: number; // entry — unix ms
  exitTradedAt?: number; // exit — unix ms
  createdAt: number;
  updatedAt: number;
}

export type NewTrade = Omit<Trade, "id" | "userId" | "createdAt" | "updatedAt">;
