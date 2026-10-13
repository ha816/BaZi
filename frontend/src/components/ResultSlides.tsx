"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { AnalysisResult } from "@/types/analysis";
import NatalTab from "./tabs/NatalTab";
import YongshinTab from "./tabs/YongshinTab";
import WolUnTab from "./tabs/WolUnTab";
import DaeunTab from "./tabs/DaeunTab";
import SeunTab from "./tabs/SeunTab";
import FortuneTab from "./tabs/FortuneTab";
import SamjaeTab from "./tabs/SamjaeTab";
import AiTab from "./tabs/AiTab";
import ZodiacTab from "./tabs/ZodiacTab";
import FengShuiTab from "./tabs/FengShuiTab";
import TimingTab from "./tabs/TimingTab";
import EnergyTab from "./tabs/EnergyTab";
import DomainFortuneSection from "./tabs/DomainFortuneSection";
import SajuChat from "./SajuChat";
import SajuCharacterCard from "./SajuCharacterCard";
import ResultIntro from "./ResultIntro";
import SelfQuizCard, { type SelfPick } from "./SelfQuizCard";
import { postFeedback } from "@/lib/api";
import { track } from "@/lib/track";

// 한 줄에 6개까지, 넘으면 아랫줄로 (globals.css .feature-tabbar). 순서 = 노출 순서.
const FEATURE_TABS = [
  { id: "natal",    emoji: "🌱", label: "만세력",     hook: "내 여덟 글자에 담긴 성향은?" },
  { id: "energy",   emoji: "⭐", label: "신살·운성",  hook: "나에게 붙은 귀인과 신살은?" },
  { id: "yongshin", emoji: "🔮", label: "용신·삼재",  hook: "나를 돕는 오행은 무엇일까?" },
  { id: "timing",   emoji: "🗓️", label: "택시(擇時)", hook: "올해 언제 움직이면 좋을까?" },
  { id: "daeun",    emoji: "🌊", label: "시운(時運)", hook: "10년·올해·이번 달의 흐름은?" },
  { id: "zodiac",   emoji: "🐾", label: "십이지신",   hook: "띠로 보는 나와 올해는?" },
  { id: "fengshui", emoji: "🧭", label: "풍수",       hook: "나에게 맞는 방향과 자리는?" },
  { id: "survey",   emoji: "📋", label: "설문조사",   hook: "사주가 나와 얼마나 맞을까? (10문항 · 1분)" },
  { id: "ai",       emoji: "✨", label: "AI 풀이",    hook: "까치가 내 사주를 이야기로 풀어 드려요" },
] as const;

type FeatureTab = typeof FEATURE_TABS[number];
type FeatureId = FeatureTab["id"];

/** 탭 맨 아래 "다음 이야기" — 다 읽은 뒤 엄지 닿는 자리에서 다음 탭으로 이어 준다. 내용 미리보기 없이 궁금증을 거는 제목(hook)만. 마지막 탭은 첫 탭(만세력)으로 */
function NextTabCard({ tabs, active, quizDone, onGo }: { tabs: readonly FeatureTab[]; active: FeatureId; quizDone: boolean; onGo: (id: FeatureId) => void }) {
  const i = tabs.findIndex((t) => t.id === active);
  const next = tabs[(i + 1) % tabs.length];
  const isLoop = i === tabs.length - 1;
  return (
    <button
      type="button"
      onClick={() => onGo(next.id)}
      className="mt-6 w-full min-h-14 rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-3.5 text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <span className="text-3xl flex-shrink-0" aria-hidden>{next.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-gold)]">
          {isLoop ? "다 둘러봤어요 🎉" : "다음 이야기"}
          {!isLoop && <span className="font-normal text-[var(--color-ink-faint)]">{i + 2}/{tabs.length} · {next.label}</span>}
        </span>
        <span className="block font-heading text-base font-bold leading-snug text-[var(--color-ink)] break-keep">{isLoop ? `처음으로 돌아가 ${next.label}부터 다시 보기` : next.id === "survey" && quizDone ? "답해 둔 설문, 내 사주와 몇 % 맞았을까?" : next.hook}</span>
      </span>
      <span className="flex-shrink-0 text-xl text-[var(--color-gold)]" aria-hidden>›</span>
    </button>
  );
}

interface Props {
  data: AnalysisResult;
  name: string;
  memberId?: string;
  profileId?: string;
}

function FeedbackBar({
  tabId,
  memberId,
  profileId,
}: {
  tabId: string;
  memberId?: string;
  profileId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (rating: number) => {
    if (!memberId || !profileId) return;
    setSubmitted(true);
    try {
      await postFeedback(memberId, profileId, tabId, rating);
    } catch {
      // fire-and-forget: 실패해도 UX 차단하지 않음
    }
  };

  return (
    <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center space-y-3">
      <p className="text-sm text-[var(--color-text-muted)]">이 해석이 도움이 됐나요?</p>
      {submitted ? (
        <p className="text-sm font-medium text-[var(--color-accent)]">감사합니다!</p>
      ) : (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => handleRate(1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface)] transition-colors"
          >
            <span>👍</span>
            <span>잘 맞아요</span>
          </button>
          <button
            type="button"
            onClick={() => handleRate(0)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface)] transition-colors"
          >
            <span>👎</span>
            <span>별로예요</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResultSlides({ data, name, memberId, profileId }: Props) {
  // 설문조사(V3) 답·제출 — 인트로 설문(?step=survey)과 설문 탭이 같이 쓴다. "다시 입력"으로 결과가 사라지면 함께 초기화
  const [quizAnswers, setQuizAnswers] = useState<Record<number, SelfPick>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  // 인트로에서 캐릭터 슬롯을 이미 돌렸는지 — 설문에서 뒤로 돌아오면 인사부터
  const [characterRevealed, setCharacterRevealed] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabbarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const tabParam = searchParams.get("tab");
  // 결과 단계(?step=) — intro: 캐릭터 공개 → [설문조사]/[분석 보기], survey: 설문 전체 화면, 없으면 대시보드(?tab=)
  const stepParam = searchParams.get("step");
  // 새 결과(주소에 step·tab이 없음)는 인트로부터 — 새로고침한 ?tab= 대시보드는 그대로. 캐릭터 없는 옛 결과는 바로 대시보드
  const [freshResult] = useState(() => !!data.natal.character?.key && !stepParam && !tabParam);
  const hasQuiz = (data.self_quiz ?? []).length > 0;
  const step = stepParam === "intro" || (stepParam === "survey" && hasQuiz) ? stepParam : freshResult && !tabParam ? "intro" : null;
  const surveyRef = useRef<HTMLDivElement>(null);
  const tabs = hasQuiz ? FEATURE_TABS : FEATURE_TABS.filter((t) => t.id !== "survey");
  // 한눈에 탭은 2026-10-13 화면에서 뺐다(postnatal.summary API는 LLM 기본 요약용으로 유지) — 옛 ?tab=summary 링크는 첫 탭으로
  const active: FeatureId = (tabs.find((t) => t.id === tabParam)?.id) ?? "natal";

  useEffect(() => {
    track("tab_view", { tab: active, has_profile: !!profileId });
  }, [active, profileId]);

  useEffect(() => {
    track("result_view", { has_profile: !!profileId });
  }, [profileId]);

  // 탭은 클라이언트 state라 서버 왕복이 필요 없다. router.replace는 RSC를 다시 받아오다 실패하면
  // 전체 새로고침으로 넘어가 결과가 사라지므로, history API로 URL만 바꾼다(useSearchParams는 같이 갱신됨).
  const handleTabChange = (id: FeatureId) => {
    window.history.replaceState(null, "", `${pathname}?tab=${id}`);
    // 아래로 내려 읽던 중이면 새 탭 첫 줄이 고정 탭바 바로 밑에 오도록 올린다 (모바일에서 탭 끝 → 다음 탭)
    const content = contentRef.current;
    const bar = tabbarRef.current;
    if (!content || !bar) return;
    const top = content.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 8;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  };

  const { natal, postnatal } = data;
  const tabProps = { natal, postnatal, name };
  const quizItems = data.self_quiz ?? [];

  useEffect(() => {
    if (step === "intro" && !stepParam) window.history.replaceState(null, "", `${pathname}?step=intro`);
  }, [step, stepParam, pathname]);

  // 인트로·설문이 화면을 덮는 동안 뒤 대시보드는 스크롤되지 않게
  useEffect(() => {
    if (!step) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [step]);

  // 단계 이동은 기록을 남긴다(pushState) — 폰 뒤로 가기로 설문 → 인트로로 돌아온다
  const goSurvey = () => {
    window.history.pushState(null, "", `${pathname}?step=survey`);
  };
  const goDashboard = () => {
    window.history.pushState(null, "", `${pathname}?tab=natal`);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-4">
      {step === "intro" && natal.character && (
        <ResultIntro
          character={natal.character}
          name={name}
          year={postnatal.year}
          revealed={characterRevealed}
          onReveal={() => setCharacterRevealed(true)}
          onSurvey={hasQuiz ? goSurvey : undefined}
          onDone={goDashboard}
        />
      )}
      {step === "survey" && (
        <div ref={surveyRef} className="fixed inset-0 z-[70] overflow-y-auto bg-[var(--color-ivory)]" role="dialog" aria-modal="true" aria-label="설문조사">
          <div className="min-h-full max-w-md mx-auto px-4 pt-4 flex flex-col">
            <div className="flex items-center justify-between h-10">
              <span className="text-xs font-semibold text-[var(--color-gold)]">📋 설문조사</span>
              {!quizSubmitted && (
                <button type="button" onClick={goDashboard} className="px-3 py-2 -mr-3 text-xs text-[var(--color-ink-faint)]">
                  분석 바로 보기 ›
                </button>
              )}
            </div>
            {/* 제출 뒤 일치율은 여기서 보여주지 않는다 — 분석을 읽기 전에 "신뢰도 낮음"부터 보면 풀이를 덜 믿게 되고,
                결과를 설문조사 탭에 남겨 두면 탭을 끝까지 넘겨 볼 이유가 된다 (2026-10-13 결정) */}
            {!quizSubmitted ? (
              <div className="flex-1 py-2">
                <SelfQuizCard
                  items={quizItems}
                  name={name}
                  answers={quizAnswers}
                  submitted={false}
                  onAnswer={(i, pick) => setQuizAnswers((a) => ({ ...a, [i]: pick }))}
                  onSubmit={() => { setQuizSubmitted(true); surveyRef.current?.scrollTo({ top: 0 }); }}
                  onReset={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 text-center score-pop">
                <span className="w-16 h-16 rounded-full bg-[var(--color-gold-faint)] border border-[var(--color-gold-light)] flex items-center justify-center text-3xl text-[var(--color-gold)]" aria-hidden>✓</span>
                <p className="font-heading text-2xl font-bold text-[var(--color-ink)]">답변 완료!</p>
                <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] break-keep">
                  사주와 얼마나 맞는지는<br />
                  <strong className="text-[var(--color-ink)]">📋 설문조사 탭</strong>에 숨겨 뒀어요.<br />
                  분석을 먼저 보고 확인해 보세요.
                </p>
              </div>
            )}
            {quizSubmitted && (
              <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[var(--color-ivory)]">
                <button type="button" onClick={goDashboard} className="btn-shimmer w-full py-3.5 rounded-xl text-base font-semibold active:opacity-70">
                  🗺️ 내 사주 분석 보기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {natal.hour_unknown && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-ivory-warm)] px-4 py-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          <span className="font-semibold text-[var(--color-ink)]">⚠️ 출생시간을 몰라 연주, 월주, 일주로만 분석했어요.</span>{" "}
          시간을 알게 되면 다시 입력해 보세요.
        </div>
      )}
      <div ref={tabbarRef} className="sticky top-0 z-30 bg-[var(--color-ivory)] -mx-4 px-4 pt-2">
        <div className="feature-tabbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`feature-tab ${active === tab.id ? "feature-tab--active" : ""}`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 인트로·설문이 덮고 있는 동안엔 탭 본문을 그리지 않는다 — 닫힌 뒤 마운트돼야 첫 카드(사주팔자) 등장 연출이 사용자 눈앞에서 돈다 */}
      {!step && (
      <div ref={contentRef} className="[overflow-anchor:none]">
        {active === "survey" && (
          <SelfQuizCard
            items={quizItems}
            name={name}
            answers={quizAnswers}
            submitted={quizSubmitted}
            onAnswer={(i, pick) => setQuizAnswers((a) => ({ ...a, [i]: pick }))}
            onSubmit={() => setQuizSubmitted(true)}
            onReset={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
          />
        )}
        {active === "timing"  && (
          <div className="space-y-4">
            <TimingTab {...tabProps} />
            <DomainFortuneSection postnatal={postnatal} />
          </div>
        )}
        {active === "natal"   && (
          <NatalTab
            {...tabProps}
            afterStrength={natal.character?.key && (
              <SajuCharacterCard character={natal.character} name={name} />
            )}
          />
        )}
        {active === "energy"  && <EnergyTab      {...tabProps} />}
        {active === "zodiac"  && <ZodiacTab      {...tabProps} />}
        {active === "daeun"   && (
          <div className="space-y-4">
            <DaeunTab {...tabProps} />
            <SeunTab {...tabProps} />
            <WolUnTab {...tabProps} />
            <FortuneTab {...tabProps} />
          </div>
        )}
        {active === "yongshin" && (
          <div className="space-y-4">
            <YongshinTab {...tabProps} />
            <SamjaeTab {...tabProps} />
          </div>
        )}
        {active === "ai"       && <AiTab           {...tabProps} />}
        {active === "fengshui" && <FengShuiTab    natal={natal} name={name} />}

        <NextTabCard tabs={tabs} active={active} quizDone={quizSubmitted} onGo={handleTabChange} />

        <FeedbackBar
          key={`${active}:${profileId ?? ""}`}
          tabId={active}
          memberId={memberId}
          profileId={profileId}
        />
      </div>
      )}

      <SajuChat />
    </div>
  );
}
