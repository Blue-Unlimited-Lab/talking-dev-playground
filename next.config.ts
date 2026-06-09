import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.*.*",
    "*.yord.xyz",
    "**.yord.xyz",
  ],
  typedRoutes: false,
};

export default nextConfig;
