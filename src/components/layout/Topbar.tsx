import { Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";

export function Topbar({ onMenuClick, title }: { onMenuClick: () => void; title: string }) {
  const user = useAuth((s) => s.user);
  const { theme, toggle } = useTheme();

  const initials =
    user?.displayName?.split(" ").map((p) => p[0]).slice(0, 2).join("") ??
    user?.email?.[0]?.toUpperCase() ??
    "T";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
      </div>

      <button
        onClick={toggle}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="hidden sm:flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-1.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
          {initials.toUpperCase()}
        </div>
        <div className="text-right leading-tight">
          <div className="text-xs font-medium">{user?.displayName ?? "Trader"}</div>
          <div className="text-[10px] text-muted-foreground">{user?.email}</div>
        </div>
      </div>
    </header>
  );
}
