import { StackClientApp } from "@stackframe/stack";
import { readEnv } from "@/lib/env";

const projectId =
  process.env.NEXT_PUBLIC_STACK_PROJECT_ID ??
  readEnv("NEXT_PUBLIC_STACK_PROJECT_ID") ??
  readEnv("STACK_PROJECT_ID");
const publishableClientKey =
  process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ??
  readEnv("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY") ??
  readEnv("STACK_PUBLISHABLE_CLIENT_KEY");

if (!projectId || !publishableClientKey) {
  throw new Error(
    "Missing Stack Auth environment variables. Ensure NEXT_PUBLIC_STACK_PROJECT_ID and NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY are configured."
  );
}

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId,
  publishableClientKey,
});
