import Exa from "exa-js";

let cachedExa: Exa | null = null;

export function getExa(): Exa {
  if (cachedExa) return cachedExa;
  const apiKey = process.env.EXA_API_KEY || process.env.EXASEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not configured");
  }
  cachedExa = new Exa(apiKey);
  return cachedExa;
}


