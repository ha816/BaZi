"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CompatibilityResult, RelationType } from "@/types/analysis";
import { getDailyCompat, type DailyCompat } from "@/lib/api";
import { track } from "@/lib/track";
import NextTabCard from "./NextTabCard";
import CompatIntro from "./compatibility/CompatIntro";
import { CompatCharacterCard, CompatScoreCard } from "./compatibility/CompatTotal";
import DailyTab from "./compatibility/DailyTab";
import DomainTab from "./compatibility/DomainTab";
import ElementTab from "./compatibility/ElementTab";
import NarrativeTab from "./compatibility/NarrativeTab";
import PillarsTab from "./compatibility/PillarsTab";
import SinsalTab from "./compatibility/SinsalTab";
import StrengthCard from "./compatibility/StrengthCard";
import ScenarioCard, { type QuizPick } from "./compatibility/ScenarioCard";
import ZodiacTab from "./compatibility/ZodiacTab";

interface Props {
  data: CompatibilityResult;
  name1: string;
  name2: string;
  relationType: RelationType;
  /** 셋 다 있을 때만(프로필×2) "오늘의 궁합" 탭을 보인다 — page.tsx가 제출 시점에 스냅샷한 값 */
  memberId?: string;
  profileId1?: string;
  profileId2?: string;
  streamingNarrative?: string;
  narrativeLoading?: boolean;
}

// 순서 = 노출 순서. 라벨은 그리드 폭 때문에 한자 없이 짧게(한자 병기는 각 카드 제목에). 탭바 포맷은 ResultSlides와 동일(globals.css .feature-tabbar)
// 한눈에 탭은 2026-10-15 뺐다(분석과 같게) — 종합 카드·두근두근은 결과 직후 인트로, 점수는 영역별 탭 맨 위, 문답은 "설문조사" 탭(2026-10-18 "이럴 때"에서 분석과 같은 이름으로).
// 탭별 한 줄(백엔드 summary)은 API에 남겨 LLM 기본 요약용으로. hook = 탭 끝 "다음 이야기" 제목
const COMPAT_TABS = [
  { id: "pillars",   emoji: "🧩", label: "팔자비교",   hook: "두 분의 여덟 글자는 어떻게 맞물릴까?" },   // 기둥 비교 + 두 분의 캐릭터 + 오행 보완
  { id: "character", emoji: "🎭", label: "성격·성질",  hook: "두 분의 성격과 성질, 닮았을까 다를까?" },  // 신살 + 신강·신약
  { id: "zodiac",    emoji: "🐾", label: "띠궁합",     hook: "띠로 보면 두 분은 어떤 사이일까?" },
  { id: "domain",    emoji: "📊", label: "영역별",     hook: "영역별로 보면 어디가 가장 잘 맞을까?" },   // 종합 점수 + 영역 카드
  { id: "daily",     emoji: "🌅", label: "오늘의 궁합", hook: "오늘 두 분의 기운은 어떨까?" },          // 프로필×2일 때만 (canDaily)
  { id: "scenario",  emoji: "📋", label: "설문조사",   hook: "사주가 두 분을 얼마나 맞힐까? (1분)" },   // character.scenarios 있을 때만 — 분석 설문조사와 같은 이름(2026-10-18)
  { id: "ai",        emoji: "✨", label: "AI 해석",    hook: "까치가 두 분의 궁합을 이야기로 풀어 드려요" },
] as const;
type CompatTabId = (typeof COMPAT_TABS)[number]["id"];

/** 궁합 결과 오케스트레이터 — 탭 정의·?tab=·?step=(인트로·문답)·탭바·다음 이야기. 본문은 compatibility/ 탭 파일 */
export default function CompatibilityResultView({ data, name1, name2, relationType, memberId, profileId1, profileId2, streamingNarrative, narrativeLoading }: Props) {
  // 신규 필드는 이전 캐시(JSONB)에 없을 수 있으므로 안전한 기본값을 여기서 한 번만 채운다
  const safe: CompatibilityResult = {
    ...data,
    pillar1_snapshot: data.pillar1_snapshot ?? null,
    pillar2_snapshot: data.pillar2_snapshot ?? null,
    pillar_relations: data.pillar_relations ?? [],
    element_complement: data.element_complement ?? { p1_lacks: [], p1_provides: [], p2_lacks: [], p2_provides: [], overlap_strong: [], score: 0 },
    shared_sinsal: data.shared_sinsal ?? [],
    unique_sinsal_1: data.unique_sinsal_1 ?? [],
    unique_sinsal_2: data.unique_sinsal_2 ?? [],
    samhap_completions: data.samhap_completions ?? [],
    key_traits: data.key_traits ?? [],
    narrative: data.narrative ?? null,
  };

  // 탭은 ResultSlides처럼 ?tab= 에 둔다 (invite·p1·p2 등 다른 파라미터는 유지)
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const canDaily = !!memberId && !!profileId1 && !!profileId2;
  const hasScenario = (safe.character?.scenarios ?? []).length > 0;
  const tabs = COMPAT_TABS.filter((t) => (t.id !== "daily" || canDaily) && (t.id !== "scenario" || hasScenario));
  // ?tab=daily + 직접 입력 → 첫 탭
  // 옛 링크 호환: 한눈에·종합→팔자비교, 오행 보완→팔자비교, 신살→성격·성질
  const LEGACY_TAB: Record<string, CompatTabId> = { summary: "pillars", total: "pillars", element: "pillars", sinsal: "character" };
  const tab: CompatTabId = tabs.find((t) => t.id === (LEGACY_TAB[tabParam ?? ""] ?? tabParam))?.id ?? "pillars";
  // 결과 단계(?step=) — intro: 두근두근 → 캐릭터·점수 → [설문조사]/[분석 보기], scenario: 설문조사(문답) 전체 화면, 없으면 탭(?tab=). 분석 ResultSlides와 같은 방식
  const stepParam = searchParams.get("step");
  // 새 결과(주소에 step·tab이 없음)만 인트로부터 — 새로고침한 ?tab=은 그대로
  const [freshResult] = useState(() => !stepParam && !tabParam);
  const step = stepParam === "intro" || (stepParam === "scenario" && hasScenario) ? stepParam : freshResult && !tabParam ? "intro" : null;
  const tabbarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scenarioRef = useRef<HTMLDivElement>(null);
  const [daily, setDaily] = useState<DailyCompat | null>(null);
  const [dailyFailed, setDailyFailed] = useState(false);
  // 인트로에서 두근두근을 이미 열었는지 — 문답에서 뒤로 돌아오면 인사부터. 결과가 바뀌면 이 뷰가 다시 마운트되어 다시 가려진다
  const [scoreRevealed, setScoreRevealed] = useState(false);
  // 설문조사(이럴 때 두 분은?) 사용자 답 — 인트로 문답과 설문조사 탭이 같이 쓴다. 화면 안에서만 쓰고 서버에 보내지 않는다
  const [quiz, setQuiz] = useState<Record<number, QuizPick>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 오늘의 궁합은 한눈에·오늘의 궁합 탭이 함께 쓰므로 결과당 한 번만 받는다
  useEffect(() => {
    if (!memberId || !profileId1 || !profileId2) return;
    let alive = true;
    getDailyCompat(memberId, profileId1, profileId2)
      .then((d) => { if (alive) setDaily(d); })
      .catch(() => { if (alive) setDailyFailed(true); });
    return () => { alive = false; };
  }, [memberId, profileId1, profileId2]);
  // invite·p1·p2 같은 다른 파라미터는 그대로 두고 step·tab만 바꾼 주소
  const urlWith = (step: string | null, tab: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (step) params.set("step", step); else params.delete("step");
    if (tab) params.set("tab", tab); else params.delete("tab");
    return `${pathname}?${params.toString()}`;
  };
  const setTab = (id: CompatTabId) => {
    // 서버 왕복 없이 URL만 바꾼다 — ResultSlides.handleTabChange 참고
    window.history.replaceState(null, "", urlWith(null, id));
    // 아래로 내려 읽던 중이면 새 탭 첫 줄이 고정 탭바 바로 밑에 오도록 올린다 (모바일에서 탭 끝 → 다음 탭)
    const content = contentRef.current;
    const bar = tabbarRef.current;
    if (!content || !bar) return;
    const top = content.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 8;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  };

  useEffect(() => {
    if (step === "intro" && !stepParam) window.history.replaceState(null, "", urlWith("intro", null));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 새 결과가 처음 뜰 때 한 번만 주소에 인트로 단계를 남긴다
  }, [step, stepParam]);

  // 인트로·문답이 화면을 덮는 동안 뒤 탭은 스크롤되지 않게
  useEffect(() => {
    if (!step) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [step]);

  // 단계 이동은 기록을 남긴다(pushState) — 폰 뒤로 가기로 문답 → 인트로로 돌아온다
  const goScenario = () => window.history.pushState(null, "", urlWith("scenario", null));
  const goTabs = () => {
    window.history.pushState(null, "", urlWith(null, "pillars"));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    track("tab_view", { tab, page: "compat", has_profile: canDaily });
  }, [tab, canDaily]);

  const tabProps = { data: safe, name1, name2, relationType };

  const scenarioProps = {
    answers: quiz,
    onAnswer: (i: number, pick: QuizPick) => setQuiz((q) => ({ ...q, [i]: pick })),
    onReset: () => { setQuiz({}); setQuizSubmitted(false); },
  };

  return (
    <div className="space-y-4">
      {step === "intro" && (
        <CompatIntro
          {...tabProps}
          revealed={scoreRevealed}
          onReveal={() => setScoreRevealed(true)}
          onScenario={hasScenario ? goScenario : undefined}
          onDone={goTabs}
        />
      )}
      {step === "scenario" && (
        <div ref={scenarioRef} className="fixed inset-0 z-[70] overflow-y-auto bg-[var(--color-ivory)]" role="dialog" aria-modal="true" aria-label="설문조사">
          <div className="min-h-full max-w-md mx-auto px-4 pt-4 flex flex-col">
            <div className="flex items-center justify-between h-10">
              <span className="text-xs font-semibold text-[var(--color-gold)]">📋 설문조사</span>
              {!quizSubmitted && (
                <button type="button" onClick={goTabs} className="px-3 py-2 -mr-3 text-xs text-[var(--color-ink-faint)]">
                  분석 바로 보기 ›
                </button>
              )}
            </div>
            {/* 제출해도 일치율은 여기서 보여주지 않는다 — 분석 설문조사와 같은 이유(풀이를 읽기 전에 김새지 않게, 탭을 끝까지 넘기게) */}
            {!quizSubmitted ? (
              <div className="flex-1 py-2">
                <ScenarioCard {...tabProps} {...scenarioProps} submitted={false} onSubmit={() => { setQuizSubmitted(true); scenarioRef.current?.scrollTo({ top: 0 }); }} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 text-center score-pop">
                <span className="w-16 h-16 rounded-full bg-[var(--color-gold-faint)] border border-[var(--color-gold-light)] flex items-center justify-center text-3xl text-[var(--color-gold)]" aria-hidden>✓</span>
                <p className="font-heading text-2xl font-bold text-[var(--color-ink)]">답변 완료!</p>
                <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] break-keep">
                  사주가 두 분을 얼마나 맞혔는지는<br />
                  <strong className="text-[var(--color-ink)]">📋 설문조사 탭</strong>에 숨겨 뒀어요.<br />
                  궁합 분석을 먼저 보고 확인해 보세요.
                </p>
              </div>
            )}
            {quizSubmitted && (
              <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[var(--color-ivory)]">
                <button type="button" onClick={goTabs} className="btn-shimmer w-full py-3.5 rounded-xl text-base font-semibold active:opacity-70">
                  💞 궁합 분석 보기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={tabbarRef} className="sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
        <div className={`feature-tabbar ${tabs.length === 7 ? "feature-tabbar--7" : ""}`}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`feature-tab ${tab === t.id ? "feature-tab--active" : ""}`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 인트로·문답이 덮고 있는 동안엔 탭 본문을 그리지 않는다 — 닫힌 뒤 마운트돼야 팔자비교 등장 연출이 사용자 눈앞에서 돈다 */}
      {!step && (
        <div ref={contentRef} className="space-y-4 [overflow-anchor:none]">
          {tab === "pillars" && (
            <div className="space-y-4">
              <PillarsTab {...tabProps} />
              {/* 인트로에서 본 칭호·역할·설명을 기둥 비교 다음에 한 번 더 (2026-10-17) */}
              <CompatCharacterCard {...tabProps} />
              <ElementTab {...tabProps} />
            </div>
          )}
          {tab === "character" && (
            <div className="space-y-4">
              <SinsalTab {...tabProps} />
              <StrengthCard {...tabProps} />
            </div>
          )}
          {tab === "zodiac" && <ZodiacTab {...tabProps} />}
          {tab === "domain" && (
            <div className="space-y-4">
              <CompatScoreCard {...tabProps} />
              <DomainTab {...tabProps} />
            </div>
          )}
          {tab === "daily" && canDaily && <DailyTab name1={name1} name2={name2} daily={daily} failed={dailyFailed} />}
          {tab === "scenario" && (
            <ScenarioCard {...tabProps} {...scenarioProps} submitted={quizSubmitted} onSubmit={() => setQuizSubmitted(true)} />
          )}
          {tab === "ai" && (
            <NarrativeTab narrative={safe.narrative} streamingNarrative={streamingNarrative} narrativeLoading={narrativeLoading} />
          )}
          <NextTabCard
            tabs={quizSubmitted ? tabs.map((t) => (t.id === "scenario" ? { ...t, hook: "답해 둔 설문조사, 사주와 몇 % 맞았을까?" } : t)) : tabs}
            active={tab}
            onGo={setTab}
          />
        </div>
      )}
    </div>
  );
}
