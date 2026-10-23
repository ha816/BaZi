import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev 서버(next dev)는 여기 없는 호스트로 오는 /_next·HMR 요청을 막아 화면이 비어 보인다.
  // localhost는 기본 허용. 다른 기기(폰 등)에서 LAN IP로 볼 때는 그 IP를 추가한다. next start(프로덕션)에는 영향 없음.
  allowedDevOrigins: ["al03044198.tail48dbe2.ts.net", "192.168.0.21", "127.0.0.1"],
  // dev에서 /api → 백엔드 프록시의 응답 대기 상한. 기본 30초라 AI 풀이 첫 글자(로컬 32B 기준 29~31초)와 겹쳐 500이 나곤 했다 (2026-10-23)
  experimental: { proxyTimeout: 300_000 },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/:path*" },
    ];
  },
};

export default nextConfig;
