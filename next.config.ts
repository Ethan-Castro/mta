import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration removed temporarily to fix build issues
  // Explicitly setting outputFileTracingRoot to a local absolute path causes issues on CI/Vercel
  // so it has been removed for portability.
  // Enable stable typed routes in Next.js 15.5
  typedRoutes: true,
  // Skip TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { dev }) {
    if (dev) {
      // Disable persistent cache in dev to avoid pack.gz header/cache corruption issues
      // and ensure .next folder is rebuilt cleanly when needed
      if (config.cache && typeof config.cache === "object") {
        config.cache = {
          type: "memory",
        } as any;
      } else {
        (config as any).cache = { type: "memory" };
      }
    }
    return config;
  },
};

export default nextConfig;
