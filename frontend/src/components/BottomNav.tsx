"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MEMBER_ID_KEY = "bazi_member_id";

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);
const IconStar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
  </svg>
);
const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const IconPerson = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const TABS_LOGGED_IN = [
  { href: "/", label: "홈", icon: <IconHome /> },
  { href: "/analysis", label: "분석", icon: <IconStar /> },
  { href: "/compatibility", label: "궁합", icon: <IconHeart /> },
  { href: "/my", label: "계정", icon: <IconPerson /> },
];

const TABS_GUEST = [
  { href: "/", label: "홈", icon: <IconHome /> },
  { href: "/analysis", label: "분석", icon: <IconStar /> },
  { href: "/compatibility", label: "궁합", icon: <IconHeart /> },
  { href: "/join", label: "로그인", icon: <IconPerson /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem(MEMBER_ID_KEY));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = loggedIn ? TABS_LOGGED_IN : TABS_GUEST;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[var(--color-card)] border-t border-[var(--color-border-light)] flex">
      {tabs.map((tab) => {
        const isActive = tab.href === "/"
          ? pathname === "/"
          : tab.href === "/my"
            ? pathname.startsWith("/my") || pathname.startsWith("/profile")
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
              isActive ? "text-[var(--color-gold)]" : "text-[var(--color-ink-faint)]"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
