import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export: the whole site is client-side, so it can be hosted anywhere (Vercel, Netlify, S3…)
  output: process.env.STATIC_EXPORT ? "export" : undefined,
  images: { unoptimized: true },
  transpilePackages: ["three"],
};

export default nextConfig;
