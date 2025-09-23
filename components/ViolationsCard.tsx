"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { postJSON } from "@/lib/mta";

type ViolationsPrediction = {
  total_violations?: number;
  by_type?: Record<string, number>;
  days?: Array<{ date: string; count: number; [key: string]: unknown }>;
  [key: string]: unknown;
};

type ViolationsResponse = {
  success?: boolean;
  prediction?: ViolationsPrediction;
  error?: string;
  [key: string]: unknown;
};

export default function ViolationsCard() {
  const [routeId, setRouteId] = useState<string>("M15");
  const [daysAhead, setDaysAhead] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ViolationsResponse | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const body = useMemo(
    () => ({ route_id: routeId, days_ahead: daysAhead }),
    [routeId, daysAhead]
  );

  async function predict() {
    setLoading(true);
    setErr(null);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    try {
      const data = await postJSON<ViolationsResponse>(
        "/predict/violations",
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
    predict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = result?.prediction?.total_violations;
  const byType = result?.prediction?.by_type;
  const series = result?.prediction?.days;

  return (
    <div className="max-w-md rounded-2xl border p-4 shadow-sm bg-card/90">
      <h3 className="text-base font-semibold mb-3">🚨 Violations forecast</h3>

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

        <label className="text-sm">
          Days ahead
          <input
            type="number"
            min={1}
            max={30}
            value={daysAhead}
            onChange={(e) => setDaysAhead(+e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </div>

      <button
        onClick={predict}
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium shadow-sm transition-all hover:bg-primary/90 disabled:opacity-70"
      >
        {loading ? "Predicting…" : "Predict Violations"}
      </button>

      {err && <p className="mt-3 text-red-600 text-sm">Error: {err}</p>}

      {loading && !result && (
        <div className="mt-3 h-28 animate-pulse rounded bg-foreground/10" />
      )}

      {result && (
        <div className="mt-3 rounded border border-border/60 bg-background/80 p-3 text-sm space-y-2">
          {typeof total === "number" && (
            <div className="flex justify-between">
              <span>Total (next {daysAhead}d)</span>
              <strong>{total}</strong>
            </div>
          )}

          {byType && (
            <div>
              <div className="mb-1 font-medium">By type</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(byType).map(([k, v]) => (
                  <React.Fragment key={k}>
                    <span className="text-foreground/70">{k}</span>
                    <span className="text-right font-medium">{v}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {series && Array.isArray(series) && series.length > 0 && (
            <div>
              <div className="mb-1 font-medium">Daily forecast</div>
              <div className="max-h-40 overflow-auto rounded border bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((d, i) => (
                      <tr key={i} className="odd:bg-gray-50">
                        <td className="px-2 py-1">{(d as any).date || i}</td>
                        <td className="px-2 py-1 text-right">{(d as any).count ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!total && !byType && !series && (
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-snug">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}


