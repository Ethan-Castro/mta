"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
const AskAI = dynamic(() => import("@/components/AskAI"), { ssr: false });

export default function DataSciencePage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; jobId?: string }>(null);
  const [showExplain, setShowExplain] = useState(false);

  async function onPredict() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ml/predict", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false });
    } finally {
      setRunning(false);
    }
  }

  async function onSimulate() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ml/simulate", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Data Science</h1>
        <p className="text-sm text-foreground/70">Trigger predictions and simulations via API stubs.</p>
      </header>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            Use these controls to call stubbed ML endpoints and view raw responses. The Ask AI panel streams a concise text summary using available tools.
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={onPredict} disabled={running} className="rounded-lg border border-foreground/10 hover:border-foreground/20 p-5 text-left transition-colors">
          <div className="font-medium">Run Prediction</div>
          <div className="text-sm text-foreground/70">Calls /api/ml/predict</div>
        </button>
        <button onClick={onSimulate} disabled={running} className="rounded-lg border border-foreground/10 hover:border-foreground/20 p-5 text-left transition-colors">
          <div className="font-medium">Run Simulation</div>
          <div className="text-sm text-foreground/70">Calls /api/ml/simulate</div>
        </button>
      </div>
      {result && (
        <pre className="text-xs bg-foreground/5 p-4 rounded-lg overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
      <AskAI />
    </div>
  );
}


