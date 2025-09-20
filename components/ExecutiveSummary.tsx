"use client";

import { useState } from "react";

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
      const res = await fetch("/api/chat", {
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
    <div className="rounded-lg border border-foreground/10 p-5 space-y-4">
      <div className="text-sm font-medium">Executive Summary (AI)</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={routeId} onChange={(e) => setRouteId(e.target.value)} placeholder="Route ID (e.g., M15)" className="rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none" />
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none" />
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={generate} disabled={loading} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-3 py-2 text-sm transition-colors">
          {loading ? "Generating…" : "Generate Summary"}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      {text && (
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{text}</div>
      )}
    </div>
  );
}


