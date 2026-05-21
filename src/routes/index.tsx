import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground text-sm">Loading…</div>;
  return <Navigate to={user ? "/dashboard" : "/login"} />;
}
