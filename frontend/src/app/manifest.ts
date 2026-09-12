import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "사주까치",
    short_name: "사주까치",
    description: "까치가 울면 반가운 소식이 온다 — 오늘의 기운을 가장 먼저 전해드립니다",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4EE",
    theme_color: "#A68B5B",
    lang: "ko",
    icons: [
      { src: "/kkachi/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/kkachi/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
