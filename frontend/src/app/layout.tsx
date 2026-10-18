import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

// 폰트는 저장소 안의 서브셋 WOFF2(가변, src/app/fonts/README.md) — 빌드·개발 서버가 구글 폰트를 받지 않는다(2026-10-18, 조각 하나 타임아웃에 컴파일이 깨지던 문제).
// 상용 한글 2,350자 밖의 음절(이름 등)은 시스템 한글 폰트로 떨어진다.
const notoSansKr = localFont({
  src: "./fonts/NotoSansKR-VF.woff2",
  variable: "--font-noto-sans-kr",
  weight: "300 700",
  display: "swap",
  fallback: ["Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
});

const notoSerifKr = localFont({
  src: "./fonts/NotoSerifKR-VF.woff2",
  variable: "--font-noto-serif-kr",
  weight: "400 700",
  display: "swap",
  fallback: ["Apple Myungjo", "Batang", "serif"],
});

// 링크 미리보기(OG)·sitemap의 절대 URL 기준. 베타는 frontend/.env.production(gitignore)에서 빌드 시 주입
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "사주까치", template: "%s | 사주까치" },
  description: "까치가 울면 반가운 소식이 온다 — 사주까치가 오늘의 기운을 가장 먼저 전해드립니다",
  openGraph: { siteName: "사주까치", locale: "ko_KR", type: "website" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "사주까치", statusBarStyle: "default" },
  icons: { icon: "/kkachi/icon-192.png", apple: "/kkachi/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#A68B5B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${notoSerifKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-sans-kr)] pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
