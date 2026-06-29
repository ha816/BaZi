"use client";

import Link from "next/link";

export default function SajuChat() {
  return (
    <Link
      href="/chat"
      className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl text-white"
      style={{ backgroundColor: "var(--color-gold)" }}
      aria-label="까치 상담"
    >
      🐦
    </Link>
  );
}
