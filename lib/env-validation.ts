import { readEnv } from "./env";

interface RequiredEnv {
  name: string;
  description: string;
  optional?: boolean;
}

const REQUIRED_ENV_VARS: RequiredEnv[] = [
  { name: "AI_GATEWAY_API_KEY", description: "Vercel AI Gateway API key for live model access", optional: true },
  { name: "NY_ACE_DATASET_ID", description: "ACE violations dataset ID from data.ny.gov", optional: true },
  { name: "NEXT_PUBLIC_MAPBOX_TOKEN", description: "Mapbox token for maps", optional: true },
  { name: "OPENAI_API_KEY", description: "OpenAI API key for AI features", optional: true },
  { name: "DATABASE_URL", description: "Database connection string", optional: true },
  { name: "NEXT_PUBLIC_ACE_API_BASE", description: "ACE API base URL for model endpoints", optional: true },
  { name: "SENDGRID_API_KEY", description: "SendGrid API key for email functionality", optional: true },
];

const CRITICAL_ENV_VARS: RequiredEnv[] = [
  { name: "NEXT_PUBLIC_STACK_PROJECT_ID", description: "Stack project ID for authentication" },
  { name: "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY", description: "Stack publishable client key" },
  { name: "STACK_SECRET_SERVER_KEY", description: "Stack secret server key" },
];

export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check critical environment variables
  for (const envVar of CRITICAL_ENV_VARS) {
    const value = readEnv(envVar.name);
    if (!value) {
      errors.push(`Missing critical environment variable: ${envVar.name} - ${envVar.description}`);
    }
  }
  
  // Check optional environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = readEnv(envVar.name);
    if (!value && !envVar.optional) {
      errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`);
    } else if (!value && envVar.optional) {
      warnings.push(`Optional environment variable not set: ${envVar.name} - ${envVar.description}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentStatus(): { valid: boolean; errors: string[]; warnings: string[] } {
  const { valid, errors, warnings } = validateEnvironment();
  
  if (errors.length > 0) {
    console.error("❌ Critical environment validation errors:");
    errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("⚠️  Environment validation warnings:");
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (valid && process.env.NODE_ENV === "development") {
    console.log("✅ Environment variables validated successfully");
  }
  
  return { valid, errors, warnings };
}

export function validateSpecificEnvVar(name: string): { valid: boolean; error?: string } {
  const value = readEnv(name);
  if (!value) {
    return {
      valid: false,
      error: `Environment variable ${name} is not set or is empty`
    };
  }
  return { valid: true };
}
