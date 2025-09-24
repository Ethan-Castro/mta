import { Suspense } from "react";
import { headers } from "next/headers";
import StudentsView from "./students-view";

async function getStudentsCurated() {
        const h = await headers();
        const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
        const host = h.get("host") || process.env.VERCEL_URL || "localhost:3000";
        const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

        const res = await fetch(
          `${base}/api/insights/curated?include=studentProfiles,studentDbRecipes,studentPrompts,hotspots`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Failed to load student insights");
  return json.data || {};
}

export default async function StudentsPage() {
  const data = getStudentsCurated();
  return (
    <Suspense fallback={<div className="rounded-lg border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">Loading curated student insights…</div>}>
      <StudentsView data={data} />
    </Suspense>
  );
}


