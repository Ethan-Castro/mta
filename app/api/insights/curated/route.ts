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
          payload.routes = await getRouteComparisons();
          break;
        case "hotspots":
          payload.hotspots = await getCuratedHotspots();
          break;
        case "repeaters":
          payload.repeaters = await getExemptRepeaterSummaries();
          break;
        case "cbdRoutes":
          payload.cbdRoutes = await getCbdRouteTrends();
          break;
        case "documents":
          payload.documents = await getDocumentationLinks();
          break;
        case "prompts": {
          const prompts = await ensurePrompts();
          payload.prompts = prompts;
          break;
        }
        case "starterPrompts": {
          if (needsAllPrompts) {
            const prompts = await ensurePrompts();
            payload.starterPrompts = prompts.filter((prompt) => prompt.category.toLowerCase() === "starter");
          } else {
            payload.starterPrompts = await getAiPrompts("starter");
          }
          break;
        }
        case "studentPrompts": {
          if (needsAllPrompts) {
            const prompts = await ensurePrompts();
            payload.studentPrompts = prompts.filter((prompt) => prompt.category.toLowerCase() === "student");
          } else {
            payload.studentPrompts = await getAiPrompts("student");
          }
          break;
        }
        case "analystScenarios":
          payload.analystScenarios = await getAnalystScenarios();
          break;
        case "studentProfiles":
          payload.studentProfiles = await getStudentCommuteProfiles();
          break;
        case "studentDbRecipes":
          payload.studentDbRecipes = await getStudentDbRecipes();
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
