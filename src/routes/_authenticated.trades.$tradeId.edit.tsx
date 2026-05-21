import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { getTrade } from "@/services/trades";
import { TradeForm } from "@/components/trades/TradeForm";
import { Skeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/_authenticated/trades/$tradeId/edit")({
  component: EditTradePage,
});

function EditTradePage() {
  const { tradeId } = Route.useParams();
  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade", tradeId],
    queryFn: () => getTrade(tradeId),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!trade) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
        <p className="text-sm text-muted-foreground">Trade not found.</p>
        <Link to="/trades" className="mt-3 inline-flex text-sm text-primary hover:underline">Back to trades</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/trades/$tradeId" params={{ tradeId }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to trade
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Edit trade</h1>
        <p className="text-sm text-muted-foreground">{trade.pair} · update setup, result, or psychology notes.</p>
      </div>
      <TradeForm key={trade.id} existing={trade} />
    </div>
  );
}
