"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AI_STARTER_PROMPTS,
  ANALYST_SCENARIOS,
  DOCUMENTATION_LINKS,
} from "@/lib/data/insights";
const AskAI = dynamic(() => import("@/components/AskAI"), { ssr: false });

const systemPrompt = `You are the ACE Transit Intelligence Copilot. Your charter:
- Reason about Automated Camera Enforcement (ACE) bus lane violations and CUNY rider demand.
- Join ACE, ridership, speed, congestion pricing, and curb regulation context.
- When unsure, ask for queries or recommend validation steps. Always cite data sources.
- Prefer SQL for structured pulls, Python for modeling, and Mapbox/Deck.gl for spatial visuals.
- Produce executive-ready narratives with next actions and confidence levels.`;

export default function DataSciencePage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; jobId?: string }>(null);
  const [showExplain, setShowExplain] = useState(false);

  const prompts = useMemo(() => AI_STARTER_PROMPTS.slice(0, 5), []);

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
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">System prompt sketch</h2>
        <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-foreground/5 p-3 rounded-lg border border-foreground/10">
{systemPrompt}
        </pre>
        <p className="text-xs text-foreground/60">Pair this with tool metadata to wire the copilot into the dashboard or external teams.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Recommended AI tools</h2>
        <ul className="space-y-2 text-sm text-foreground/80">
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">sql.query(dataset, sql)</div>
            <p className="mt-1 text-xs text-foreground/60">Run parameterized ACE, ridership, or congestion pricing queries and stream tabular results.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">python.exec(code, files)</div>
            <p className="mt-1 text-xs text-foreground/60">Model violation forecasts, Monte Carlo simulations, or causal comparisons with pandas + statsmodels.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">viz.map(geojson, options)</div>
            <p className="mt-1 text-xs text-foreground/60">Render hotspots, route alignments, or pre/post CBD segments directly from the assistant.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">report.generate(sections)</div>
            <p className="mt-1 text-xs text-foreground/60">Assemble stakeholder-ready briefs with summary, metrics, visuals, and recommended actions.</p>
          </li>
        </ul>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Prompt library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setResult({ ok: true, jobId: prompt })}
              className="rounded-lg border border-foreground/10 px-3 py-2 text-left hover:border-foreground/30 transition-colors"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/60">Click a prompt to stage it. Replace this stub with direct calls into the assistant API.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Scenario blueprints</h2>
        <ul className="space-y-3 text-sm text-foreground/80">
          {ANALYST_SCENARIOS.map((scenario) => (
            <li key={scenario.title} className="rounded-lg border border-foreground/10 p-3">
              <div className="font-medium text-foreground/90">{scenario.title}</div>
              <div className="mt-1 text-xs text-foreground/60">Expected inputs: {scenario.expectedInputs}</div>
              <p className="mt-2 leading-relaxed">{scenario.description}</p>
              <p className="mt-2 text-xs text-foreground/60">Playbook: {scenario.playbook}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Reference material</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {DOCUMENTATION_LINKS.map((doc) => (
            <a key={doc.href} href={doc.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-foreground/10 px-3 py-2 hover:border-foreground/30 transition-colors">
              <div className="font-medium text-foreground/90">{doc.title}</div>
              <p className="mt-1 text-xs text-foreground/60 leading-relaxed">{doc.summary}</p>
            </a>
          ))}
        </div>
      </div>
      <AskAI />
    </div>
  );
}

