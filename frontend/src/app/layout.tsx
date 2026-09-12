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

export const metadata: Metadata = {
  title: "사주까치",
  description: "까치가 울면 반가운 소식이 온다 — 사주까치가 오늘의 기운을 가장 먼저 전해드립니다",
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
