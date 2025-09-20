import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration removed temporarily to fix build issues
  // Explicitly set the workspace root to avoid lockfile mis-detection
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
