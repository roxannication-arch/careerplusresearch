import type { NextConfig } from "next";
import path from "node:path";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  skipWaiting: true,
});

const nextConfig: NextConfig = withPWA({
  turbopack: {
    root: path.resolve(__dirname),
  },
});

export default nextConfig;
