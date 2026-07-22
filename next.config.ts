import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Google profile pictures (OAuth avatars)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  allowedDevOrigins: ["192.168.29.84"],
};

export default nextConfig;
