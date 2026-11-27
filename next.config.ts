import type { NextConfig } from "next";

/**
 * KITCHEN_OS_STATIC_EXPORT=1 produces a fully static build in /out (no server).
 * In that mode the AI Chef API route is unavailable, so the client falls back
 * to the clearly labelled Demo Mode.
 */
const isStaticExport = process.env.KITCHEN_OS_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  ...(isStaticExport ? { output: "export" as const, trailingSlash: true } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
