import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["al03044198.tail48dbe2.ts.net"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/:path*" },
    ];
  },
};

export default nextConfig;
