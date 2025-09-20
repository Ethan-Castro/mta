"use client";

import { useEffect, useState } from "react";

type Row = { bus_route_id: string; date_trunc_ym: string; violations: string; exempt_count: string };

export default function ExecutiveKpis() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/violations/summary?limit=1000", { cache: "no-store" });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "Failed to load");
        setRows(j.rows as Row[]);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalViolations = rows.reduce((a, r) => a + Number(r.violations || 0), 0);
  const totalExempt = rows.reduce((a, r) => a + Number(r.exempt_count || 0), 0);
  const exemptShare = totalViolations ? Math.round((totalExempt / totalViolations) * 1000) / 10 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="text-xs text-foreground/60">Violations (sample)</div>
        <div className="text-2xl font-medium mt-1">{loading ? "—" : totalViolations.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="text-xs text-foreground/60">Exempt share</div>
        <div className="text-2xl font-medium mt-1">{loading ? "—%" : `${exemptShare}%`}</div>
      </div>
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="text-xs text-foreground/60">Routes (observed)</div>
        <div className="text-2xl font-medium mt-1">{loading ? "—" : new Set(rows.map(r => r.bus_route_id)).size}</div>
      </div>
      {error && <div className="md:col-span-3 text-xs text-red-500">{error}</div>}
    </div>
  );
}


