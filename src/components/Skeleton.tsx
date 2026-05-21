import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
