"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { postJSON } from "@/lib/mta";

type AnalysisResponse = {
  success?: boolean;
  summary?: string;
  metrics?: Record<string, number | string>;
  recommendations?: string[];
  [key: string]: unknown;
};

export default function RouteAnalysisCard() {
  const [routeId, setRouteId] = useState<string>("M15");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const body = useMemo(() => ({ route_id: routeId }), [routeId]);

  async function analyze() {
    setLoading(true);
    setErr(null);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    try {
      const data = await postJSON<AnalysisResponse>(
        "/analyze/route",
        body,
        controllerRef.current.signal
      );
      setResult(data);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md rounded-2xl border p-4 shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-3">🧭 Route Analysis</h3>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm col-span-2">
          Route ID
          <input
            type="text"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </div>

      <button
        onClick={analyze}
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-black text-white py-2 font-medium disabled:opacity-70"
      >
        {loading ? "Analyzing…" : "Analyze Route"}
      </button>

      {err && <p className="mt-3 text-red-600 text-sm">Error: {err}</p>}

      {result && (
        <div className="mt-3 rounded bg-gray-50 p-3 text-sm space-y-3">
          {result.summary && (
            <div>
              <div className="mb-1 font-medium">Summary</div>
              <p className="text-foreground/80">{result.summary}</p>
            </div>
          )}

          {result.metrics && (
            <div>
              <div className="mb-1 font-medium">Key metrics</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(result.metrics).map(([k, v]) => (
                  <React.Fragment key={k}>
                    <span className="text-foreground/70">{k}</span>
                    <span className="text-right font-medium">{String(v)}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
            <div>
              <div className="mb-1 font-medium">Recommendations</div>
              <ul className="list-disc pl-5 space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {(!result.summary && !result.metrics && !result.recommendations) && (
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-snug">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}


