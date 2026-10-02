import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: false,
  distDir: ".next-build",
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
