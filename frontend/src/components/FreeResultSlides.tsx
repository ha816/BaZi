"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BasicResult } from "@/types/analysis";
import PillarDetail from "./PillarDetail";
import ElementRadar, { buildElementNarrative } from "./ElementRadar";
import KkachiTip from "./KkachiTip";
import SectionHeader from "./SectionHeader";
import ShareCard from "./ShareCard";
import { preparePayment } from "@/lib/api";
import { MEMBER_ID_KEY } from "@/lib/constants";

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


interface Props {
  data: BasicResult;
}

function ConceptBox({ storageKey, label, children }: { storageKey: string; label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "closed") setOpen(false);
  }, [storageKey]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, next ? "open" : "closed");
  };

  return (
    <div className="rounded-xl bg-[var(--color-ivory-warm)] border border-[var(--color-border-light)] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <p className="text-xs font-semibold text-[var(--color-ink-light)] tracking-wide">{label}</p>
        <span className="text-[var(--color-ink-faint)] text-xs ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

function buildPersonalizedTeaser(data: BasicResult): string {
  const dayPillar = data.pillars[2] ?? "";
  const elementMeaning = data.my_element.meaning;
  const elementName = data.my_element.name;
  const relation = data.zodiac_relation;

  let tone: string;
  if (relation.includes("합") || relation.includes("생")) {
    tone = "순조로운 흐름이 기대되는 해예요";
  } else if (relation.includes("충")) {
    tone = "긴장과 변화가 많은 해예요";
  } else {
    tone = "신중하게 방향을 잡아야 하는 해예요";
  }

  return `${elementMeaning}(${elementName}) 기운의 ${dayPillar} 일주에게, 올해는 ${data.year_branch}의 기운이 들어와 ${relation} 관계가 만들어져요. ${tone}.`;
}

export default function FreeResultSlides({ data }: Props) {
  const router = useRouter();

  const handleDeepAnalysis = async () => {
    const memberId = localStorage.getItem(MEMBER_ID_KEY);
    if (!memberId) {
      router.push("/join");
      return;
    }
    try {
      const { order_id, amount, feature_type, order_name } = await preparePayment({
        member_id: memberId,
        feature_type: "deep_analysis",
      });
      router.push(
        `/payment/checkout?order_id=${order_id}&amount=${amount}&feature_type=${feature_type}&order_name=${encodeURIComponent(order_name)}`
      );
    } catch {
      router.push("/join");
    }
  };

  return (
    <div className="space-y-8 relative">

      {/* ── 섹션 1: 기초 (무료) */}
      <div className="space-y-4">
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader emoji="🌱" title="사주팔자(四柱八字)" free noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-5">
            <ConceptBox storageKey="kkachi_concept_saju" label="사주팔자란?">
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                태어난 <strong className="text-[var(--color-ink)]">연·월·일·시</strong>를 각각 하늘(천간)과 땅(지지) 두 글자로 표현한 것이 <strong className="text-[var(--color-ink)]">사주(四柱)</strong>, 그 여덟 글자를 <strong className="text-[var(--color-ink)]">팔자(八字)</strong>라 부릅니다. 각 글자는 木·火·土·金·水 다섯 오행으로 이루어져 있으며, 이 조합이 타고난 기질·적성·인연의 흐름을 담고 있습니다.
              </p>
            </ConceptBox>
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
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행(五行)</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">무료</span>
            </div>
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-5">
            <ConceptBox storageKey="kkachi_concept_oheng" label="오행이란?">
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                만물을 이루는 다섯 가지 기운 — <strong className="text-[var(--color-ink)]">木(나무)·火(불)·土(흙)·金(쇠)·水(물)</strong>. 사주 여덟 글자 각각은 이 오행 중 하나에 속하며, 어떤 기운이 많고 적은지에 따라 성격·체질·적성이 달라집니다.
              </p>
            </ConceptBox>
            <ElementRadar stats={data.element_stats} showNarrative={false} />
            {(() => {
              const maxVal = Math.max(...Object.values(data.element_stats));
              const tops = Object.entries(data.element_stats).filter(([, v]) => v === maxVal).map(([k]) => k);
              return tops.length === 1 ? (
                <img src={`/oheng/oheng_${tops[0]}.png`} alt={tops[0]} className="w-full rounded-xl object-cover" style={{ height: 275 }} />
              ) : (
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tops.length}, 1fr)` }}>
                  {tops.map((el) => (
                    <img key={el} src={`/oheng/oheng_${el}.png`} alt={el} className="w-full rounded-lg object-cover" style={{ height: 275 }} />
                  ))}
                </div>
              );
            })()}
            <KkachiTip>{buildElementNarrative(data.element_stats)}</KkachiTip>
          </div>
        </div>
      </div>


      {/* ── 개인화 티저 */}
      <div className="slide-card border border-[var(--color-gold)]">
        <div className="slide-card__body space-y-3">
          <p className="text-[10px] font-semibold text-[var(--color-gold)] tracking-widest uppercase">심층분석 미리보기</p>
          {/* 까치 말풍선 */}
          <div className="flex items-start gap-3">
            <img
              src="/kkachi/normal_kkachi_00.png"
              alt="까치"
              className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-[var(--color-gold)]"
              style={{ objectPosition: "50% 55%" }}
            />
            <div className="flex-1 bg-[var(--color-ivory-warm)] rounded-2xl rounded-tl-none px-4 py-3 relative">
              <p className="text-[10px] font-semibold text-[var(--color-ink-faint)] mb-1">까치의 한마디</p>
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{buildPersonalizedTeaser(data)}</p>
            </div>
          </div>
          {/* 블러 힌트 */}
          <div className="relative overflow-hidden rounded-xl bg-[var(--color-ivory)] px-4 py-3">
            <div className="space-y-1.5 blur-sm select-none opacity-60">
              <p className="text-sm text-[var(--color-ink-light)]">• 재물·건강·대인·직장 영역별 운세 점수와 그 근거</p>
              <p className="text-sm text-[var(--color-ink-light)]">• 현재 내가 어느 대운(大運) 시기에 있는지</p>
              <p className="text-sm text-[var(--color-ink-light)]">• 올해 집중할 달, 조심할 달 월별 가이드</p>
            </div>
            <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(to bottom, transparent 10%, var(--color-ivory) 85%)" }} />
          </div>
        </div>
      </div>

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
            <button
              onClick={handleDeepAnalysis}
              className="px-8 py-3.5 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-xl text-sm font-semibold hover:bg-[var(--color-ink-light)] transition-colors shadow-md"
            >
              심층분석 시작하기 →
            </button>
            <ShareButtons data={data} />
          </div>
        </div>
      </div>

    </div>
  );
}
