"use client";

import { useState } from "react";

export default function AskAI() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function ask() {
    setLoading(true);
    setError("");
    setText("");
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setText((t) => t + decoder.decode(value));
      }
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-foreground/10 p-5 space-y-4">
      <div className="text-sm font-medium">Ask AI</div>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about routes, violations, speeds…" className="flex-1 rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none" />
        <button onClick={ask} disabled={loading || !q} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-3 py-2 text-sm transition-colors">{loading ? "Thinking…" : "Ask"}</button>
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      {text && <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{text}</div>}
    </div>
  );
}


