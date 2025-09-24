"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { postJSON } from "@/lib/mta";

type SpeedPrediction = {
  speed_mph?: number;
  confidence_interval?: [number, number];
  traffic_level?: "smooth" | "moderate" | "congested";
};

type SpeedResponse = {
  success?: boolean;
  prediction?: SpeedPrediction | null;
  error?: string;
};

export default function SpeedCard() {
  const [hour, setHour] = useState<number>(14);
  const [weekend, setWeekend] = useState<boolean>(false);
  const [dist, setDist] = useState<number>(0.5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<SpeedResponse | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const body = useMemo(
    () => ({
      hour,
      is_weekend: weekend,
      distance_to_cuny: dist,
      road_distance: 1.5,
      month: new Date().getMonth() + 1,
    }),
    [hour, weekend, dist]
  );

  async function predict() {
    setLoading(true);
    setErr(null);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    try {
      const data = await postJSON<SpeedResponse>("/predict/speed", body, controllerRef.current.signal);
      setResult(data);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // auto-run on mount
    predict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prediction = result?.prediction ?? null;
  const speedValue = typeof prediction?.speed_mph === "number" ? `${prediction.speed_mph} mph` : "—";
  const confidenceInterval = Array.isArray(prediction?.confidence_interval)
    ? (prediction!.confidence_interval as [number, number])
    : null;
  const [ciLow, ciHigh] = confidenceInterval ?? [null, null];
  const trafficLabel = prediction?.traffic_level ?? "unknown";
  const hasPrediction = Boolean(prediction);

  return (
    <div className="max-w-md rounded-2xl border p-4 shadow-sm bg-card/90">
      <header className="mb-3 space-y-1">
        <h3 className="text-base font-semibold">🚌 Speed prediction</h3>
        <p className="text-xs text-foreground/70">
          Notebook A’s <code className="font-mono text-[11px]">/predict/speed</code> model estimates curbside bus speed for the scenario below.
          Tune hour, weekend status, and distance inputs to stress-test operations.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Hour
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(+e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>

        <label className="text-sm">
          Dist to CUNY (km)
          <input
            type="number"
            step="0.1"
            value={dist}
            onChange={(e) => setDist(+e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>

        <label className="col-span-2 text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={weekend}
            onChange={(e) => setWeekend(e.target.checked)}
          />
          Weekend
        </label>
      </div>

      <button
        onClick={predict}
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium shadow-sm transition-all hover:bg-primary/90 disabled:opacity-70"
      >
        {loading ? "Predicting…" : "Predict Speed"}
      </button>

      {err && <p className="mt-3 status-negative text-sm">Error: {err}</p>}

      {loading && !result && (
        <div className="mt-3 h-24 animate-pulse rounded bg-foreground/10" />
      )}

      {result && (
        hasPrediction ? (
          <div className="mt-3 rounded border border-border/60 bg-background/80 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Predicted speed</span>
              <strong>{speedValue}</strong>
            </div>
            <div className="flex justify-between">
              <span>Traffic</span>
              <strong
                className={
                  trafficLabel === "smooth"
                    ? "status-positive"
                    : trafficLabel === "moderate"
                    ? "status-warning"
                    : "status-negative"
                }
              >
                {trafficLabel}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Confidence</span>
              <span>
                {ciLow != null && ciHigh != null ? `${ciLow} – ${ciHigh} mph` : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded border border-border/60 bg-background/80 p-3 text-sm text-muted-foreground">
            {result?.error || "No prediction available for the current parameters."}
          </div>
        )
      )}

      <footer className="mt-3 text-[11px] text-muted-foreground">
        Source: {process.env.NEXT_PUBLIC_NOTEBOOK_A_BASE || "Notebook A API"}
      </footer>
    </div>
  );
}
