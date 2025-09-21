import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration removed temporarily to fix build issues
  // Explicitly set the workspace root to avoid lockfile mis-detection
  outputFileTracingRoot: "/Users/ethancastro/mta",
  // Enable stable typed routes in Next.js 15.5
  typedRoutes: true,
};

export default nextConfig;
