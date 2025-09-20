"use client";

import { useState } from "react";
import ExecutiveSummary from "@/components/ExecutiveSummary";
import ExecutiveKpis from "@/components/ExecutiveKpis";
export default function ExecutivePage() {
  const [showExplain, setShowExplain] = useState(false);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Executive Overview</h1>
        <p className="text-sm text-foreground/70">KPIs, trends, and narrative insights.</p>
      </header>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            High-level KPIs summarize recent ACE violations and exempt shares. Generate an AI summary for context over a selected time window.
          </div>
        )}
      </div>
      <ExecutiveKpis />
      <div>
        <ExecutiveSummary />
      </div>
    </div>
  );
}


