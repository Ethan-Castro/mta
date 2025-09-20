export type SocrataClientOptions = {
  baseUrl?: string; // e.g., https://data.ny.gov
  appToken?: string;
  apiKeyId?: string;
  apiKeySecret?: string;
};

export class SocrataClient {
  private readonly baseUrl: string;
  private readonly appToken?: string;
  private readonly apiKeyId?: string;
  private readonly apiKeySecret?: string;

  constructor(opts: SocrataClientOptions) {
    this.baseUrl = opts.baseUrl || "https://data.ny.gov";
    this.appToken = opts.appToken;
    this.apiKeyId = opts.apiKeyId;
    this.apiKeySecret = opts.apiKeySecret;
  }

  async get(datasetId: string, params: Record<string, string | number | boolean | undefined> = {}) {
    const url = new URL(`${this.baseUrl}/resource/${datasetId}.json`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const headers: Record<string, string> = {};
    if (this.appToken) headers["X-App-Token"] = this.appToken;
    if (this.apiKeyId && this.apiKeySecret) {
      const basic = Buffer.from(`${this.apiKeyId}:${this.apiKeySecret}`).toString("base64");
      headers.authorization = `Basic ${basic}`;
    }

    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Socrata error ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getAll(
    datasetId: string,
    params: Record<string, string | number | boolean | undefined> = {},
    pageSize: number = 50000,
    maxPages: number = 200
  ) {
    const results: unknown[] = [];
    let offset = Number(params.$offset || 0);
    const limit = Number(params.$limit || pageSize);
    for (let page = 0; page < maxPages; page++) {
      const pageParams = { ...params, $limit: limit, $offset: offset } as Record<string, string | number | boolean>;
      // eslint-disable-next-line no-await-in-loop
      const chunk = (await this.get(datasetId, pageParams)) as unknown[];
      results.push(...chunk);
      if (chunk.length < limit) break;
      offset += limit;
    }
    return results;
  }
}

export function createSocrataFromEnv() {
  const appToken = process.env.SOCRATA_APP_TOKEN; // optional (low-rate without)
  return new SocrataClient({
    appToken,
    apiKeyId: process.env.NY_API_KEY_ID,
    apiKeySecret: process.env.NY_API_KEY_SECRET,
    baseUrl: process.env.NY_DATA_BASE_URL || "https://data.ny.gov",
  });
}


