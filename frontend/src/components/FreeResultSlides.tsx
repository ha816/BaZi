"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { BasicResult } from "@/types/analysis";
import PillarDetail from "./PillarDetail";
import ElementRadar from "./ElementRadar";
import SectionHeader from "./SectionHeader";
import ShareCard from "./ShareCard";

function ShareButtons({ data }: { data: BasicResult }) {
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [name, setName] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(sessionStorage.getItem("kkachi_analysis_name") ?? "");
  }, []);

  const shareText = [
    name ? `${name}의 사주팔자` : "나의 사주팔자",
    `${data.pillars.join(" ")}`,
    `${data.my_element.meaning}(${data.my_element.name}) 기운을 타고났어요 🪶`,
    "",
    "사주까치에서 내 사주를 확인해봤어요",
    typeof window !== "undefined" ? window.location.origin : "",
  ].join("\n");

  const handleTextShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageShare = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });

      // Web Share API로 이미지 파일 공유 (지원 시)
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "내사주.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: "사주까치에서 내 사주를 확인해봤어요 🪶" }).catch(() => {});
      } else {
        // 폴백: 다운로드
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${name || "내"}사주.png`;
        a.click();
      }
    } finally {
      setCapturing(false);
    }
  };

  return (
    <>
      {/* 숨겨진 공유 카드 (캡처용) */}
      <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }}>
        <ShareCard ref={cardRef} data={data} name={name} />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleImageShare}
          disabled={capturing}
          className="flex items-center gap-1.5 text-xs font-medium bg-[var(--color-card)] text-[var(--color-ink)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 hover:bg-[var(--color-ivory-warm)] transition-colors disabled:opacity-60"
        >
          {capturing ? "생성 중..." : "🖼️ 이미지 카드"}
        </button>
        <button
          type="button"
          onClick={handleTextShare}
          className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 hover:bg-[var(--color-ivory-warm)] transition-colors"
        >
          {copied ? "✓ 복사됨" : "🔗 링크 공유"}
        </button>
      </div>
    </>
  );
}

const ZODIAC: Record<string, { kor: string; emoji: string; keywords: string[] }> = {
  "子": { kor: "쥐", emoji: "🐭", keywords: ["영민함", "민첩함", "사교성"] },
  "丑": { kor: "소", emoji: "🐂", keywords: ["성실함", "인내", "신뢰"] },
  "寅": { kor: "호랑이", emoji: "🐯", keywords: ["용기", "리더십", "열정"] },
  "卯": { kor: "토끼", emoji: "🐰", keywords: ["온화함", "직관", "예술성"] },
  "辰": { kor: "용", emoji: "🐲", keywords: ["카리스마", "야망", "창의"] },
  "巳": { kor: "뱀", emoji: "🐍", keywords: ["지혜", "신중함", "통찰"] },
  "午": { kor: "말", emoji: "🐴", keywords: ["자유", "활동성", "독립"] },
  "未": { kor: "양", emoji: "🐑", keywords: ["평화", "온순", "예술감"] },
  "申": { kor: "원숭이", emoji: "🐒", keywords: ["기지", "유머", "적응력"] },
  "酉": { kor: "닭", emoji: "🐓", keywords: ["꼼꼼함", "성실", "완벽주의"] },
  "戌": { kor: "개", emoji: "🐕", keywords: ["충직함", "의리", "정직"] },
  "亥": { kor: "돼지", emoji: "🐗", keywords: ["복", "너그러움", "성실"] },
};


interface Props {
  data: BasicResult;
}

export default function FreeResultSlides({ data }: Props) {
  const zodiac = ZODIAC[data.year_branch];

  return (
    <div className="space-y-8 relative">

      {/* ── 섹션 1: 기초 (무료) */}
      <div className="space-y-4">
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader emoji="🌱" title="타고난 사주팔자(四柱八字)" free noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <PillarDetail
              pillars={data.pillars}
              dayStem={data.day_stem}
              basic
            />
          </div>
        </div>
        <div className="slide-card">
          <div className="slide-card__header">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행(五行) 분포</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">무료</span>
            </div>
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <ElementRadar stats={data.element_stats} />
          </div>
        </div>
      </div>

      {/* ── 섹션 2: 12지신 — 기본 정보 무료, zodiac_relation부터 블러 시작 */}
      {zodiac && (
        <div className="slide-card overflow-hidden">
          <div className="slide-card__header">
            <SectionHeader emoji="" title="나의 띠 · 십이지신(十二支神)" free noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[var(--color-ivory-warm)] flex items-center justify-center text-4xl">
                {zodiac.emoji}
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-[var(--color-ink)]">{zodiac.kor}띠</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{data.year_branch}年 생</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {zodiac.keywords.map((kw) => (
                    <span key={kw} className="text-xs bg-[var(--color-ivory)] border border-[var(--color-border-light)] rounded-full px-2.5 py-0.5 text-[var(--color-ink-muted)]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* zodiac_relation 부터 블러 — 이야기가 끊기는 지점 */}
            <div className="relative mt-4 pt-4 border-t border-[var(--color-border-light)]">
              <p className="text-sm text-[var(--color-ink-light)] leading-relaxed blur-sm select-none pointer-events-none opacity-80 line-clamp-3">
                {data.zodiac_relation}
              </p>
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 10%, var(--color-card) 70%)" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 심층분석 CTA — 60% 지점 */}
      <div className="relative">
        {/* 블러 처리된 미리보기 */}
        <div className="blur-sm pointer-events-none select-none space-y-4 opacity-60">
          <div className="flex items-center gap-2">
            <span className="text-base">⭐</span>
            <h2 className="font-heading text-base font-bold text-[var(--color-ink)]">올해의 운세</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">프리미엄</span>
          </div>
          <div className="slide-card">
            <div className="slide-card__body space-y-3">
              <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                올해 들어오는 기운이 나의 사주와 어떻게 작용하는지, 어느 영역에서 기회와 주의가 필요한지 분석합니다.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["재물운", "건강운", "대인운", "직장운"].map((label) => (
                  <div key={label} className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)] text-center">
                    <div className="text-sm font-medium text-[var(--color-ink)]">{label}</div>
                    <div className="mt-1 h-2 rounded-full bg-[var(--color-border)] w-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-gold)]" style={{ width: "70%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base">🌊</span>
            <h2 className="font-heading text-base font-bold text-[var(--color-ink)]">큰 흐름 · 대운</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">프리미엄</span>
          </div>
          <div className="slide-card">
            <div className="slide-card__body">
              <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                10년 단위의 대운 흐름과 현재 내가 어느 시기에 있는지를 확인하세요.
              </p>
            </div>
          </div>
        </div>

        {/* 그라데이션 페이드 + CTA 오버레이 */}
        <div
          className="absolute inset-0 flex flex-col items-end justify-end pb-4"
          style={{ background: "linear-gradient(to bottom, transparent 0%, var(--color-parchment) 40%)" }}
        >
          <div className="w-full flex flex-col items-center gap-3">
            <div className="text-center space-y-1 px-4">
              <p className="font-heading text-base font-bold text-[var(--color-ink)]">올해 운세 · 인생 흐름 · 종합 조언</p>
              <p className="text-sm text-[var(--color-ink-muted)]">심층분석으로 전체 내용을 확인하세요</p>
            </div>
            <Link
              href="/analysis/deep"
              className="px-8 py-3.5 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-xl text-sm font-semibold hover:bg-[var(--color-ink-light)] transition-colors shadow-md"
            >
              심층분석 시작하기 →
            </Link>
            <ShareButtons data={data} />
          </div>
        </div>
      </div>

    </div>
  );
}
