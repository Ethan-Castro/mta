import { NextResponse } from "next/server";
import {
  getAiPrompts,
  getAnalystScenarios,
  getCbdRouteTrends,
  getCuratedHotspots,
  getDocumentationLinks,
  getExemptRepeaterSummaries,
  getRouteComparisons,
  getStudentCommuteProfiles,
  getStudentDbRecipes,
} from "@/lib/data/insights";

const ALL_KEYS = [
  "routes",
  "hotspots",
  "repeaters",
  "cbdRoutes",
  "documents",
  "prompts",
  "starterPrompts",
  "studentPrompts",
  "analystScenarios",
  "studentProfiles",
  "studentDbRecipes",
] as const;

type CuratedKey = (typeof ALL_KEYS)[number];

async function loadWithFallback<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[curated] failed to load ${label}`, error);
    return fallback;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeParam = url.searchParams.get("include");
    let requestedKeys: CuratedKey[] = [...ALL_KEYS];

    if (includeParam) {
      const parts = includeParam
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean) as CuratedKey[];
      const valid = parts.filter((part): part is CuratedKey => (ALL_KEYS as unknown as string[]).includes(part));
      if (valid.length) {
        requestedKeys = valid;
      }
    }

    const payload: Record<string, unknown> = {};
    const needsAllPrompts = new Set(requestedKeys).has("prompts");
    let cachedPrompts: Awaited<ReturnType<typeof getAiPrompts>> | null = null;

    async function ensurePrompts() {
      if (cachedPrompts) return cachedPrompts;
      cachedPrompts = await getAiPrompts();
      return cachedPrompts;
    }

    for (const key of requestedKeys) {
      switch (key) {
        case "routes":
          payload.routes = await loadWithFallback("routes", getRouteComparisons, []);
          break;
        case "hotspots":
          payload.hotspots = await loadWithFallback("hotspots", getCuratedHotspots, []);
          break;
        case "repeaters":
          payload.repeaters = await loadWithFallback("repeaters", getExemptRepeaterSummaries, []);
          break;
        case "cbdRoutes":
          payload.cbdRoutes = await loadWithFallback("cbdRoutes", getCbdRouteTrends, []);
          break;
        case "documents":
          payload.documents = await loadWithFallback("documents", getDocumentationLinks, []);
          break;
        case "prompts": {
          const prompts = await loadWithFallback("prompts", ensurePrompts, []);
          payload.prompts = prompts;
          break;
        }
        case "starterPrompts": {
          const prompts = needsAllPrompts
            ? await loadWithFallback("prompts", ensurePrompts, [])
            : await loadWithFallback("starterPrompts", () => getAiPrompts("starter"), []);
          payload.starterPrompts = Array.isArray(prompts)
            ? prompts.filter((prompt) => (prompt?.category || "").toLowerCase() === "starter")
            : [];
          break;
        }
        case "studentPrompts": {
          const prompts = needsAllPrompts
            ? await loadWithFallback("prompts", ensurePrompts, [])
            : await loadWithFallback("studentPrompts", () => getAiPrompts("student"), []);
          payload.studentPrompts = Array.isArray(prompts)
            ? prompts.filter((prompt) => (prompt?.category || "").toLowerCase() === "student")
            : [];
          break;
        }
        case "analystScenarios":
          payload.analystScenarios = await loadWithFallback("analystScenarios", getAnalystScenarios, []);
          break;
        case "studentProfiles":
          payload.studentProfiles = await loadWithFallback("studentProfiles", getStudentCommuteProfiles, []);
          break;
        case "studentDbRecipes":
          payload.studentDbRecipes = await loadWithFallback("studentDbRecipes", getStudentDbRecipes, []);
          break;
      }
    }

    return NextResponse.json({ ok: true, data: payload });
  } catch (error: any) {
    console.error("/api/insights/curated failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Unable to load curated insights",
      },
      { status: 500 }
    );
  }
}
