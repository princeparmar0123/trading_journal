import { useState } from "react";
import { X } from "lucide-react";

export function ScreenshotModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-md"
    >
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-card/80 p-2 text-foreground hover:bg-card"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={url}
        alt="Trade screenshot"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[95vw] rounded-2xl border border-border shadow-2xl"
      />
    </div>
  );
}

export function useScreenshotModal() {
  const [url, setUrl] = useState<string | null>(null);
  return {
    open: (u: string) => setUrl(u),
    close: () => setUrl(null),
    node: url ? <ScreenshotModal url={url} onClose={() => setUrl(null)} /> : null,
  };
}
