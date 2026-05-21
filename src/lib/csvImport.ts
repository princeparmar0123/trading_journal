import { deriveResult } from "@/lib/tradeCalc";
import type { NewTrade, TradeSession } from "@/types/trade";

export interface CsvImportRowError {
  row: number;
  message: string;
}

export interface CsvImportResult {
  trades: NewTrade[];
  errors: CsvImportRowError[];
  skipped: number;
}

/** Parse RFC 4180-style CSV text into rows of string cells. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === "\"" && next === "\"") {
        cell += "\"";
        i++;
      } else if (ch === "\"") {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === "\"") {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

function parseNumber(value: string, field: string): number {
  const n = Number(value?.replace(/,/g, "").trim());
  if (!Number.isFinite(n)) throw new Error(`Invalid ${field}`);
  return n;
}

function parseDateMs(value: string, field: string): number {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`Missing ${field}`);
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) throw new Error(`Invalid ${field}`);
  return ms;
}

function mapDirection(value: string): "buy" | "sell" {
  const v = value.trim().toLowerCase();
  if (v === "long" || v === "buy") return "buy";
  if (v === "short" || v === "sell") return "sell";
  throw new Error(`Unknown direction: ${value}`);
}

function sessionFromTimestamp(ms: number): TradeSession {
  const hour = new Date(ms).getUTCHours();
  if (hour >= 0 && hour < 7) return "asian";
  if (hour >= 7 && hour < 12) return "london";
  if (hour >= 12 && hour < 16) return "overlap";
  if (hour >= 16 && hour < 22) return "newyork";
  return "asian";
}

function getCell(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

function rowToRecord(headers: string[], cells: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((h, i) => {
    record[normalizeHeader(h)] = cells[i] ?? "";
  });
  return record;
}

function isTradeFxBookFormat(headers: string[]): boolean {
  const set = new Set(headers.map(normalizeHeader));
  return set.has("symbol") && set.has("entryprice") && set.has("p&l");
}

function isAppExportFormat(headers: string[]): boolean {
  const set = new Set(headers.map(normalizeHeader));
  return set.has("tradedat") && set.has("pair") && set.has("direction");
}

function mapTradeFxBookRow(row: Record<string, string>): NewTrade {
  const pair = getCell(row, "symbol").toUpperCase();
  if (!pair) throw new Error("Missing symbol");

  const direction = mapDirection(getCell(row, "type", "direction"));
  const entryPrice = parseNumber(getCell(row, "entryprice"), "entry price");
  const exitPrice = parseNumber(getCell(row, "exitprice"), "exit price");
  const lotSize = parseNumber(getCell(row, "quantity", "lotsize"), "quantity");
  const pnl = parseNumber(getCell(row, "p&l", "pnl"), "P&L");
  const tradedAt = parseDateMs(getCell(row, "entrydate", "tradedat"), "entry date");
  const exitTradedAt = parseDateMs(
    getCell(row, "exitdate", "exittradedat") || getCell(row, "entrydate"),
    "exit date",
  );

  const source = getCell(row, "source") || "CSV import";
  const notes = getCell(row, "notes");

  return {
    pair,
    direction,
    entryPrice,
    exitPrice,
    stopLoss: entryPrice,
    takeProfit: exitPrice,
    lotSize,
    riskPercent: 1,
    result: deriveResult(pnl),
    pnl,
    rrRatio: 0,
    strategy: source.slice(0, 60),
    session: sessionFromTimestamp(tradedAt),
    emotionBefore: "",
    preTradeReview: "",
    postTradeReview: "",
    lesson: "",
    notes,
    tradedAt,
    exitTradedAt,
    screenshotUrl: null,
  };
}

function mapAppExportRow(row: Record<string, string>): NewTrade {
  const pair = getCell(row, "pair").toUpperCase();
  const direction = mapDirection(getCell(row, "direction"));
  const entryPrice = parseNumber(getCell(row, "entryprice"), "entry price");
  const exitPrice = parseNumber(getCell(row, "exitprice") || getCell(row, "takeprofit"), "exit price");
  const lotSize = parseNumber(getCell(row, "lotsize"), "lot size");
  const pnl = parseNumber(getCell(row, "pnl"), "P&L");
  const tradedAt = parseDateMs(getCell(row, "tradedat"), "traded at");
  const exitTradedAt = parseDateMs(
    getCell(row, "exittradedat") || getCell(row, "tradedat"),
    "exit date",
  );

  return {
    pair,
    direction,
    entryPrice,
    exitPrice,
    stopLoss: parseNumber(getCell(row, "stoploss") || String(entryPrice), "stop loss"),
    takeProfit: exitPrice,
    lotSize,
    riskPercent: parseNumber(getCell(row, "riskpercent") || "1", "risk %"),
    result: (getCell(row, "result") as NewTrade["result"]) || deriveResult(pnl),
    pnl,
    rrRatio: parseNumber(getCell(row, "rrratio") || "0", "RR"),
    strategy: getCell(row, "strategy") || "Imported",
    session: (getCell(row, "session") as TradeSession) || sessionFromTimestamp(tradedAt),
    emotionBefore: getCell(row, "emotionbefore"),
    preTradeReview: getCell(row, "pretradereview"),
    postTradeReview: getCell(row, "posttradereview"),
    lesson: getCell(row, "lesson"),
    notes: getCell(row, "notes"),
    tradedAt,
    exitTradedAt,
    screenshotUrl: null,
  };
}

/** Parse CSV file content into trades ready for Firestore. */
export function parseTradesCsv(csvText: string): CsvImportResult {
  const table = parseCsvText(csvText.trim());
  if (table.length < 2) {
    return { trades: [], errors: [{ row: 0, message: "CSV is empty or has no data rows" }], skipped: 0 };
  }

  const headerRow = table[0];
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const tradeFx = isTradeFxBookFormat(headerRow);
  const appExport = isAppExportFormat(headerRow);

  if (!tradeFx && !appExport) {
    return {
      trades: [],
      errors: [{
        row: 1,
        message: "Unrecognized CSV format. Use TradeFXBook export or this app's export columns.",
      }],
      skipped: 0,
    };
  }

  const trades: NewTrade[] = [];
  const errors: CsvImportRowError[] = [];
  let skipped = 0;

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    if (cells.every((c) => !c.trim())) {
      skipped++;
      continue;
    }

    const rowNum = i + 1;
    try {
      const record = rowToRecord(headerRow, cells);
      const trade = tradeFx ? mapTradeFxBookRow(record) : mapAppExportRow(record);
      trades.push(trade);
    } catch (err) {
      errors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Invalid row",
      });
    }
  }

  return { trades, errors, skipped };
}
