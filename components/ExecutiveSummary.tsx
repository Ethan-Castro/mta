"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function ExecutiveSummary() {
  const [routeId, setRouteId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function generate() {
    setLoading(true);
    setError("");
    setText("");
    try {
      const res = await fetch("/api/agents/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ routeId: routeId || undefined, start: start || undefined, end: end || undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to generate summary");
      setText(json.text);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-gradient-to-br from-background/95 via-background/90 to-primary/10 p-5 shadow-soft-lg sm:p-6">
      <div className="relative z-10 space-y-5">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            Executive Summary (AI)
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline-flex">Draft briefings with curated prompts &amp; filters.</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            placeholder="Route ID (e.g., M15) — optional"
            aria-label="Route ID"
            className="rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm shadow-sm transition-all duration-300 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Start date and time"
            className="rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm shadow-sm transition-all duration-300 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="End date and time"
            className="rounded-lg border border-foreground/15 bg-background/80 px-3 py-2 text-sm shadow-sm transition-all duration-300 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={generate}
            disabled={loading}
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              "Generate summary"
            )}
          </button>
          {error && (
            <span className="animate-fade-up text-xs font-medium text-destructive">
              Couldn&apos;t generate summary. Try again.
            </span>
          )}
        </div>
        {text && (
          <div className="relative overflow-hidden rounded-lg border border-primary/15 bg-background/95 p-4 text-sm leading-relaxed text-foreground/90 shadow-inner animate-fade-up">
            <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60" aria-hidden />
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" aria-hidden />
            <div className="relative z-10 whitespace-pre-wrap">{text}</div>
          </div>
        )}
      </div>
    </div>
  );
}
