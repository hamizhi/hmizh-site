import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const nextConfig = (phase: string): NextConfig => ({
  images: { unoptimized: true },
  trailingSlash: false,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next-build",
  serverExternalPackages: ["better-sqlite3"],
});

export default nextConfig;
