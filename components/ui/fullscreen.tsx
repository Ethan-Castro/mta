"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FullscreenProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function FullscreenContainer({ children, className, ariaLabel }: FullscreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const enter = useCallback(async () => {
    const el: any = containerRef.current as any;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      setIsFullscreen(true);
    } catch {}
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      setIsFullscreen(false);
    } catch {}
  }, []);

  useEffect(() => {
    // Compute support on client only after mount to avoid SSR/client divergence
    const doc: any = typeof document !== "undefined" ? (document as any) : null;
    const el: any = typeof document !== "undefined" ? (document.documentElement as any) : null;
    const supported = !!(
      doc && (
        doc.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        (el && (el.requestFullscreen || el.webkitRequestFullscreen))
      )
    );
    setIsSupported(supported);

    if (!doc) return;
    const handleChange = () => {
      const active = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(active);
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange as any);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)} aria-label={ariaLabel}>
      {children}
      {isSupported ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-2">
          {!isFullscreen ? (
            <button
              type="button"
              onClick={enter}
              className="pointer-events-auto inline-flex items-center rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs text-foreground/80 transition-all hover:border-primary/40 hover:text-foreground"
            >
              Fullscreen
            </button>
          ) : (
            <button
              type="button"
              onClick={exit}
              className="pointer-events-auto inline-flex items-center rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs text-foreground/80 transition-all hover:border-primary/40 hover:text-foreground"
            >
              Exit
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}


