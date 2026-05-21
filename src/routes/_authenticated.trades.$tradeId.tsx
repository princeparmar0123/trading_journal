import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/trades/$tradeId")({
  component: TradeIdLayout,
});

function TradeIdLayout() {
  return <Outlet />;
}
