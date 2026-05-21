import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2, TrendingUp, TrendingDown, ArrowRightLeft,
  Target, Shield, Brain, Upload, Trash2, ImageIcon,
} from "lucide-react";

import { tradeFormSchema, tradeToFormValues, type TradeFormInput, type TradeFormValues } from "@/lib/tradeSchema";
import { deriveResult } from "@/lib/tradeCalc";
import type { TradeSession } from "@/types/trade";
import { useAuth } from "@/store/auth";
import { isCloudinaryConfigured } from "@/services/cloudinary";
import { uploadScreenshot } from "@/services/storage";
import { createTrade, updateTrade } from "@/services/trades";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

const cardClass =
  "rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 p-6 shadow-soft backdrop-blur-sm";
const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";
const inputClass =
  "w-full rounded-xl border border-input/80 bg-background/70 px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const errorClass = "mt-1.5 text-xs text-destructive";

function toDateTimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateInput(ts: unknown): string {
  return typeof ts === "number" && !Number.isNaN(ts) ? toDateTimeLocal(ts) : "";
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function TradeForm({ existing }: { existing?: Trade }) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(existing?.screenshotUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const entryDateRef = useRef<HTMLInputElement>(null);
  const exitDateRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.showPicker?.();
  };

  const form = useForm<TradeFormInput, unknown, TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: existing
      ? tradeToFormValues(existing)
      : {
          pair: "",
          direction: undefined,
          entryPrice: undefined,
          exitPrice: undefined,
          lotSize: undefined,
          riskPercent: undefined,
          pnl: undefined,
          strategy: "",
          session: undefined,
          emotionBefore: "",
          preTradeReview: "",
          postTradeReview: "",
          lesson: "",
          notes: "",
          tradedAt: Date.now(),
          exitTradedAt: undefined,
          screenshotUrl: null,
        },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = form;

  useEffect(() => {
    if (existing) {
      reset(tradeToFormValues(existing));
      setScreenshotUrl(existing.screenshotUrl ?? null);
    }
  }, [existing, reset]);

  const direction = watch("direction");
  const pnl = watch("pnl");
  const tradedAt = watch("tradedAt") as number | undefined;
  const exitTradedAt = watch("exitTradedAt") as number | undefined;

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    if (!isCloudinaryConfigured) {
      toast.error("Cloudinary not configured", {
        description: "Add CLOUDINARY_URL to .env and restart the dev server",
      });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadScreenshot(user.uid, file);
      setScreenshotUrl(url);
      setValue("screenshotUrl", url, { shouldDirty: true });
      toast.success("Chart image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setUploading(false);
    }
  };

  const pnlNum =
    pnl === undefined || pnl === null || Number.isNaN(Number(pnl)) ? null : Number(pnl);
  const hasPnl = pnlNum !== null && !Number.isNaN(pnlNum);
  const result = hasPnl ? deriveResult(pnlNum) : null;
  const pnlPositive = hasPnl && pnlNum > 0;
  const pnlNegative = hasPnl && pnlNum < 0;

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    try {
      const payload = {
        ...values,
        exitPrice: values.exitPrice,
        takeProfit: values.exitPrice,
        result: deriveResult(values.pnl),
        rrRatio: existing?.rrRatio ?? 0,
        screenshotUrl: screenshotUrl ?? null,
      };
      if (existing) {
        await updateTrade(existing.id, payload);
        await queryClient.invalidateQueries({ queryKey: ["trades", user.uid] });
        await queryClient.invalidateQueries({ queryKey: ["trade", existing.id] });
        toast.success("Trade updated");
        navigate({ to: "/trades/$tradeId", params: { tradeId: existing.id } });
      } else {
        await createTrade(user.uid, payload);
        await queryClient.invalidateQueries({ queryKey: ["trades", user.uid] });
        toast.success("Trade logged");
        navigate({ to: "/trades" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Save failed", { description: err instanceof Error ? err.message : "" });
    }
  }, (fieldErrors) => {
    const first = Object.values(fieldErrors)[0];
    toast.error("Please fix the form", {
      description: first?.message ?? "Some fields are invalid or missing",
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
      <section className={cardClass}>
        <SectionHeader icon={ArrowRightLeft} title="Instrument" subtitle="Pair, side, and entry time" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pair</label>
            <input className={cn(inputClass, "font-mono uppercase")} placeholder="e.g. EURUSD" {...register("pair")} />
            {errors.pair && <p className={errorClass}>{errors.pair.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Entry date & time</label>
            <input
              ref={entryDateRef}
              type="datetime-local"
              className={cn(inputClass, "cursor-pointer")}
              value={formatDateInput(tradedAt)}
              onClick={() => openDatePicker(entryDateRef)}
              onFocus={() => openDatePicker(entryDateRef)}
              onChange={(e) =>
                setValue("tradedAt", e.target.value ? new Date(e.target.value).getTime() : undefined, {
                  shouldDirty: true,
                })
              }
            />
            {errors.tradedAt && <p className={errorClass}>{errors.tradedAt.message}</p>}
          </div>
        </div>

        <input type="hidden" {...register("direction")} />

        <div className="mt-5">
          <label className={labelClass}>Direction</label>
          <div className="grid grid-cols-2 gap-3">
            {(["buy", "sell"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue("direction", d, { shouldDirty: true })}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all",
                  direction === d
                    ? d === "buy"
                      ? "border-[var(--profit)]/50 bg-[color-mix(in_oklab,var(--profit)_12%,transparent)] text-[var(--profit)] shadow-sm"
                      : "border-[var(--loss)]/50 bg-[color-mix(in_oklab,var(--loss)_12%,transparent)] text-[var(--loss)] shadow-sm"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:bg-accent/50",
                )}
              >
                {d === "buy" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {d === "buy" ? "Buy / Long" : "Sell / Short"}
              </button>
            ))}
          </div>
          {errors.direction && <p className={errorClass}>{errors.direction.message}</p>}
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Target} title="Execution" subtitle="Prices, exit time, and lot size" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border/40 bg-background/50 p-4">
            <label className={labelClass}>Entry price</label>
            <input type="number" step="any" placeholder="e.g. 1.08500" className={cn(inputClass, "font-mono text-lg")} {...register("entryPrice")} />
            {errors.entryPrice && <p className={errorClass}>{errors.entryPrice.message}</p>}
          </div>
          <div className="rounded-xl border border-border/40 bg-background/50 p-4">
            <label className={labelClass}>Exit price</label>
            <input type="number" step="any" placeholder="e.g. 1.09000" className={cn(inputClass, "font-mono text-lg")} {...register("exitPrice")} />
            {errors.exitPrice && <p className={errorClass}>{errors.exitPrice.message}</p>}
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Exit date & time</label>
            <input
              ref={exitDateRef}
              type="datetime-local"
              className={cn(inputClass, "cursor-pointer")}
              value={formatDateInput(exitTradedAt)}
              onClick={() => openDatePicker(exitDateRef)}
              onFocus={() => openDatePicker(exitDateRef)}
              onChange={(e) =>
                setValue("exitTradedAt", e.target.value ? new Date(e.target.value).getTime() : undefined, {
                  shouldDirty: true,
                })
              }
            />
            {errors.exitTradedAt && <p className={errorClass}>{errors.exitTradedAt.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Lot size</label>
            <input type="number" step="any" placeholder="e.g. 0.10" className={cn(inputClass, "font-mono")} {...register("lotSize")} />
            {errors.lotSize && <p className={errorClass}>{errors.lotSize.message}</p>}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/50 bg-background/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <label className={labelClass}>Profit/Loss</label>
            {hasPnl && result && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                  result === "win" && "bg-[color-mix(in_oklab,var(--profit)_14%,transparent)] text-[var(--profit)]",
                  result === "loss" && "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-[var(--loss)]",
                  result === "breakeven" && "bg-muted text-muted-foreground",
                )}
              >
                {result}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] flex-1">
              <input
                type="number"
                step="any"
                placeholder="e.g. 150 or -75"
                className={cn(
                  inputClass,
                  "font-mono text-2xl font-bold",
                  pnlPositive && "text-[var(--profit)]",
                  pnlNegative && "text-[var(--loss)]",
                )}
                {...register("pnl")}
              />
              {errors.pnl && <p className={errorClass}>{errors.pnl.message}</p>}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="text-[10px] font-semibold uppercase tracking-widest">USD</div>
              <div
                className={cn(
                  "font-display text-xl font-bold",
                  hasPnl && pnlPositive && "text-[var(--profit)]",
                  hasPnl && pnlNegative && "text-[var(--loss)]",
                  !hasPnl && "text-muted-foreground/50",
                )}
              >
                {hasPnl ? `${pnlNum! >= 0 ? "+" : ""}${formatCurrency(pnlNum!)}` : "—"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={ImageIcon} title="Chart" subtitle="Upload a screenshot — stored on Cloudinary" />
        {screenshotUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border/50">
            <img src={screenshotUrl} alt="Trade chart" className="h-56 w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setScreenshotUrl(null);
                setValue("screenshotUrl", null, { shouldDirty: true });
              }}
              className="absolute right-2 top-2 rounded-lg bg-background/90 p-1.5 text-destructive shadow-sm hover:bg-background"
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-background/40 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span>Tap to upload chart image</span>
                <span className="text-xs text-muted-foreground/70">PNG, JPG · max 5MB</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImageUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Shield} title="Risk & context" subtitle="Strategy, session, and risk %" />
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Strategy</label>
            <input className={inputClass} placeholder="e.g. ICT FVG, break of structure" {...register("strategy")} />
            {errors.strategy && <p className={errorClass}>{errors.strategy.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Session</label>
            <select
              className={inputClass}
              value={(watch("session") as TradeSession | undefined) ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setValue("session", v as TradeSession, { shouldDirty: true, shouldValidate: true });
              }}
            >
              <option value="" disabled>
                Select session
              </option>
              <option value="asian">Asian</option>
              <option value="london">London</option>
              <option value="newyork">New York</option>
              <option value="overlap">London/NY Overlap</option>
            </select>
            {errors.session && <p className={errorClass}>{errors.session.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Risk %</label>
            <input type="number" step="any" placeholder="e.g. 1" className={cn(inputClass, "font-mono")} {...register("riskPercent")} />
            {errors.riskPercent && <p className={errorClass}>{errors.riskPercent.message}</p>}
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Brain} title="Psychology & review" subtitle="Pre/post trade reflection and lessons" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Emotion</label>
            <input className={inputClass} placeholder="e.g. calm, FOMO, hesitant" {...register("emotionBefore")} />
          </div>
          <div>
            <label className={labelClass}>Lesson learned</label>
            <textarea rows={3} className={inputClass} placeholder="What will you do differently?" {...register("lesson")} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Pre trade review</label>
            <textarea
              rows={4}
              className={inputClass}
              placeholder="Setup, plan, confluence, why you're taking this trade…"
              {...register("preTradeReview")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Post trade review</label>
            <textarea
              rows={4}
              className={inputClass}
              placeholder="Execution, outcome, what you did well or poorly…"
              {...register("postTradeReview")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea rows={3} className={inputClass} placeholder="Additional notes about this trade" {...register("notes")} />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => navigate({ to: "/trades" })}
          className="rounded-xl border border-border bg-card/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? "Save changes" : "Log trade"}
        </button>
      </div>
    </form>
  );
}
