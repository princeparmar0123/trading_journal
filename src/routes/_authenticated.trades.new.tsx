import { createFileRoute } from "@tanstack/react-router";
import { TradeForm } from "@/components/trades/TradeForm";

export const Route = createFileRoute("/_authenticated/trades/new")({
  component: NewTradePage,
});

function NewTradePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New trade</h1>
        <p className="text-sm text-muted-foreground">Capture the setup, the result, and what you learned.</p>
      </div>
      <TradeForm />
    </div>
  );
}
