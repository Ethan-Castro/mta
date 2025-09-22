"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function GlobalFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const start = sp.get("start") ?? "";
  const end = sp.get("end") ?? "";
  const routeId = sp.get("routeId") ?? "";

  function onChange(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <input
        value={routeId}
        placeholder="Route (e.g., M15-SBS)"
        onChange={(e) => onChange("routeId", e.currentTarget.value)}
        className="rounded border border-border/60 bg-background/90 px-2 py-1"
      />
      <input
        value={start}
        placeholder="Start ISO"
        onChange={(e) => onChange("start", e.currentTarget.value)}
        className="rounded border border-border/60 bg-background/90 px-2 py-1"
      />
      <input
        value={end}
        placeholder="End ISO"
        onChange={(e) => onChange("end", e.currentTarget.value)}
        className="rounded border border-border/60 bg-background/90 px-2 py-1"
      />
    </div>
  );
}


