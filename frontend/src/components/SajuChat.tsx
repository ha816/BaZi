"use client";

import Link from "next/link";

export default function SajuChat() {
  return (
    <Link
      href="/chat"
      className="fixed bottom-24 right-4 z-[60] h-14 rounded-full shadow-lg flex items-center gap-2 pl-3 pr-4 text-white"
      style={{ backgroundColor: "var(--color-gold)" }}
      aria-label="까치 상담"
    >
      <span className="text-2xl leading-none">🐦</span>
      <span className="text-sm font-semibold">까치 상담</span>
    </Link>
  );
}
