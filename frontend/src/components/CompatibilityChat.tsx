"use client";

import Link from "next/link";

export default function CompatibilityChat() {
  return (
    <Link
      href="/compatibility/chat"
      className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
      style={{ backgroundColor: "var(--color-gold)", color: "#fff" }}
      aria-label="궁합 상담"
    >
      💞
    </Link>
  );
}
