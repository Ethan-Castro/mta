"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { postJSON } from "@/lib/mta";

type SpeedResponse = {
  success: boolean;
  prediction: {
    speed_mph: number;
    confidence_interval: [number, number];
    traffic_level: "smooth" | "moderate" | "congested";
  };
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

  return (
    <div className="max-w-md rounded-2xl border p-4 shadow-sm bg-card/90">
      <h3 className="text-base font-semibold mb-3">🚌 Speed prediction</h3>

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

      {err && <p className="mt-3 text-red-600 text-sm">Error: {err}</p>}

      {loading && !result && (
        <div className="mt-3 h-24 animate-pulse rounded bg-foreground/10" />
      )}

      {result && (
        <div className="mt-3 rounded border border-border/60 bg-background/80 p-3 text-sm">
          <div className="flex justify-between">
            <span>Predicted speed</span>
            <strong>{result.prediction.speed_mph} mph</strong>
          </div>
          <div className="flex justify-between">
            <span>Traffic</span>
            <strong className={
              result.prediction.traffic_level === "smooth" ? "text-green-600" :
              result.prediction.traffic_level === "moderate" ? "text-amber-600" : "text-red-600"
            }>
              {result.prediction.traffic_level}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>Confidence</span>
            <span>
              {result.prediction.confidence_interval[0]} – {result.prediction.confidence_interval[1]} mph
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


