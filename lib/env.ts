const QUOTE_WRAP = /^(["'])(.*)\1$/;

export function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(QUOTE_WRAP, "$2");
  return unquoted.replace(/\\n/g, "");
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Environment variable ${name} is required but was not provided.`);
  }
  return value;
}
