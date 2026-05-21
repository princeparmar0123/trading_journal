import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const requiredPositive = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: `${label} is required` }).positive(`${label} must be > 0`),
  );

const requiredNumber = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` }),
  );

const requiredTimestamp = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: `${label} is required` }).int().positive(`${label} is required`),
  );

export const tradeFormSchema = z.object({
  pair: z.string().trim().min(2, "Required").max(20).regex(/^[A-Z0-9./-]+$/i, "Use letters/digits"),
  direction: z.preprocess(
    emptyToUndefined,
    z.enum(["buy", "sell"], { required_error: "Select direction" }),
  ),
  entryPrice: requiredPositive("Entry price"),
  exitPrice: requiredPositive("Exit price"),
  lotSize: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: "Lot size is required" })
      .positive("Lot size must be > 0"),
  ),
  riskPercent: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: "Risk % is required" }).min(0).max(100),
  ),
  pnl: requiredNumber("Profit/Loss"),
  strategy: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? "General" : v),
    z.string().trim().min(1, "Required").max(60),
  ),
  session: z.preprocess(
    emptyToUndefined,
    z.enum(["asian", "london", "newyork", "overlap"], { required_error: "Select session" }),
  ),
  emotionBefore: z.string().max(140),
  preTradeReview: z.string().max(800),
  postTradeReview: z.string().max(800),
  lesson: z.string().max(300),
  notes: z.string().max(800),
  tradedAt: requiredTimestamp("Entry date"),
  exitTradedAt: requiredTimestamp("Exit date"),
  screenshotUrl: z.string().nullable(),
});

export type TradeFormInput = z.input<typeof tradeFormSchema>;
export type TradeFormValues = z.infer<typeof tradeFormSchema>;

/** Build default form values from an existing trade document. */
export function tradeToFormValues(trade: {
  pair: string;
  direction: "buy" | "sell";
  entryPrice: number;
  exitPrice?: number;
  takeProfit?: number;
  lotSize: number;
  riskPercent: number;
  pnl: number;
  strategy: string;
  session: "asian" | "london" | "newyork" | "overlap";
  emotionBefore: string;
  preTradeReview?: string;
  postTradeReview?: string;
  lesson: string;
  notes: string;
  tradedAt: number;
  exitTradedAt?: number;
  screenshotUrl: string | null;
}): TradeFormValues {
  const exitPrice = trade.exitPrice ?? trade.takeProfit ?? trade.entryPrice;
  return {
    pair: trade.pair,
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    exitPrice,
    lotSize: trade.lotSize,
    riskPercent: trade.riskPercent,
    pnl: trade.pnl,
    strategy: trade.strategy?.trim() || "General",
    session: trade.session,
    emotionBefore: trade.emotionBefore ?? "",
    preTradeReview: trade.preTradeReview ?? "",
    postTradeReview: trade.postTradeReview ?? "",
    lesson: trade.lesson ?? "",
    notes: trade.notes ?? "",
    tradedAt: trade.tradedAt,
    exitTradedAt: trade.exitTradedAt ?? trade.tradedAt,
    screenshotUrl: trade.screenshotUrl ?? null,
  };
}
