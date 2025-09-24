import "server-only";

import { StackServerApp } from "@stackframe/stack";
import { readEnv } from "@/lib/env";

const projectId = readEnv("NEXT_PUBLIC_STACK_PROJECT_ID") ?? readEnv("STACK_PROJECT_ID");
const publishableClientKey =
  readEnv("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY") ?? readEnv("STACK_PUBLISHABLE_CLIENT_KEY");
const secretServerKey = readEnv("STACK_SECRET_SERVER_KEY");

if (!projectId || !publishableClientKey || !secretServerKey) {
  throw new Error(
    "Missing Stack Auth environment variables. Ensure NEXT_PUBLIC_STACK_PROJECT_ID, NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY, and STACK_SECRET_SERVER_KEY are configured."
  );
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId,
  publishableClientKey,
  secretServerKey,
});
