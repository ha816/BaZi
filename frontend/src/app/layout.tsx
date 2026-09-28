import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
