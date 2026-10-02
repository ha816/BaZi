"use client";

import { useState } from "react";
import { RELATION_FOCUS_DOMAINS, RELATION_TYPE_LABEL } from "@/lib/constants";
import { getElementInfo } from "@/lib/elementColors";
import SectionHeader from "../SectionHeader";
import { DOMAIN_ICONS } from "./DomainTab";
import type { CompatTabProps } from "./types";

interface Props extends CompatTabProps {
  /** 영역 점수 아래 "영역별 해설 보기" → 영역별 탭 */
  onNavigate?: (tab: string) => void;
  /** 점수 공개 여부 — 오케스트레이터가 결과 단위로 기억(탭을 오가도 다시 가리지 않음) */
  revealed: boolean;
  onReveal: () => void;
}

// 드럼 치는 까치 그림 — 파일이 없으면 기본 까치 + 🥁 애니메이션으로 대신한다
const DRUM_IMG = "/kkachi/drum_kkachi.png";
const FALLBACK_IMG = "/kkachi/good_kkachi.png";
const DRUMROLL_MS = 1200;

/** 공개 전 — "두근두근 ○○님과 ○○님의 궁합은?" + 드럼 치는 까치 + 버튼 → 드럼롤 후 공개 */
function RevealGate({ name1, name2, onReveal }: { name1: string; name2: string; onReveal: () => void }) {
  const [rolling, setRolling] = useState(false);
  const [hasDrumImg, setHasDrumImg] = useState(true);
  const handle = () => {
    if (rolling) return;
    setRolling(true);
    setTimeout(onReveal, DRUMROLL_MS);
  };
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <p className="font-heading text-lg font-bold text-[var(--color-ink)] heart-thump">
        두근두근 💓<br />
        <span className="text-[var(--color-gold)]">{name1}님</span>과 <span className="text-[var(--color-gold)]">{name2}님</span>의 궁합은?
      </p>
      <div className="relative w-40 h-40">
        <img
          src={hasDrumImg ? DRUM_IMG : FALLBACK_IMG}
          alt="드럼 치는 까치"
          className={`w-40 h-40 rounded-full object-cover border-4 border-[var(--color-gold-faint)] ${rolling ? "heart-thump" : ""}`}
          onError={() => setHasDrumImg(false)}
        />
        {!hasDrumImg && (
          <>
            <span className={`absolute -left-2 bottom-2 text-4xl drum-beat ${rolling ? "drum-beat--fast" : ""}`} aria-hidden>🥁</span>
            <span className={`absolute -right-2 top-2 text-3xl drum-beat ${rolling ? "drum-beat--fast" : ""}`} style={{ animationDelay: "0.3s" }} aria-hidden>🥁</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handle}
        disabled={rolling}
        className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
      >
        {rolling ? "두구두구두구…" : "💞 두 분의 궁합 확인하기"}
      </button>
    </div>
  );
}

/** 오행 캐릭터 그림 — compat/{key}.png, 없으면 두 사람 역할 이모지를 크게 */
function CharacterArt({ imgKey, emojis }: { imgKey: string; emojis: string[] }) {
  const [hasImg, setHasImg] = useState(true);
  if (hasImg) {
    return (
      <img
        src={`/kkachi/compat/${imgKey}.png`}
        alt=""
        className="w-full max-w-[18rem] mx-auto aspect-square rounded-2xl object-cover"
        onError={() => setHasImg(false)}
      />
    );
  }
  return (
    <div className="flex items-center justify-center gap-3 py-2 text-6xl" aria-hidden>
      <span className="drum-beat" style={{ animationDuration: "1.6s" }}>{emojis[0]}</span>
      <span className="text-2xl text-[var(--color-gold-light)] heart-thump">♥</span>
      <span className="drum-beat" style={{ animationDuration: "1.6s", animationDelay: "0.4s" }}>{emojis[1]}</span>
    </div>
  );
}

/** 종합 궁합 — 공개 전 두근두근 게이트, 공개 후 오행 캐릭터 카드 + 점수 한 줄(관계별 중요한 두 영역). 자세한 영역은 영역별 탭 */
export default function TotalTab({ data, name1, name2, relationType, onNavigate, revealed, onReveal }: Props) {
  const { total_score, label, description, pillar1_snapshot, pillar2_snapshot, domain_scores } = data;
  const focus = RELATION_FOCUS_DOMAINS[relationType].filter((k) => domain_scores[k] != null);
  const ch = data.character;
  const fill = (t: string) => t.replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);
  const unknown1 = !!pillar1_snapshot?.hour_unknown;
  const unknown2 = !!pillar2_snapshot?.hour_unknown;
  return (
    <div className="slide-card">
      <div className="slide-card__header">
        <SectionHeader title="종합 궁합" noMargin />
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        {!revealed ? (
          <RevealGate name1={name1} name2={name2} onReveal={onReveal} />
        ) : (
          <div className="space-y-4 score-pop">
            {ch ? (
              <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-4 text-center space-y-3">
                <CharacterArt imgKey={ch.key} emojis={ch.roles.map((r) => r.emoji)} />
                <p className="text-[11px] font-semibold text-[var(--color-gold)]">{RELATION_TYPE_LABEL[relationType]} 궁합 · 두 분은</p>
                <p className="font-heading text-2xl font-bold leading-snug text-[var(--color-ink)]">{ch.title}</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {ch.roles.map((ro, i) => {
                    const info = getElementInfo(ro.element);
                    return (
                      <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border bg-white" style={{ borderColor: info.borderColor, color: info.color }}>
                        <span className="font-semibold">{i === 0 ? name1 : name2}님</span> = {ro.emoji} {ro.name}
                        <span className="text-[10px] opacity-70">({info.korean}{ro.element})</span>
                      </span>
                    );
                  })}
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-ink)]">{fill(ch.desc)}</p>
              </div>
            ) : (
              <p className="text-sm text-center leading-relaxed text-[var(--color-ink-muted)]">{description}</p>
            )}

            <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] px-4 py-3 flex items-center gap-3">
              <div className="flex-shrink-0 text-center">
                <p className="text-[10px] text-[var(--color-ink-faint)]">궁합 점수</p>
                <p className="font-heading text-3xl font-bold leading-none text-[var(--color-ink)]">{total_score}<span className="text-xs font-normal text-[var(--color-ink-faint)]">점</span></p>
                <p className="text-[11px] font-semibold text-[var(--color-gold)] mt-0.5">{label}</p>
              </div>
              <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 justify-end">
                {focus.map((k) => {
                  const d = domain_scores[k];
                  return (
                    <span key={k} className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-gold-light)] bg-white text-[var(--color-ink)] whitespace-nowrap">
                      {DOMAIN_ICONS[k] ?? "◎"} {d.display_name ?? k} <strong>{d.score}</strong>
                    </span>
                  );
                })}
              </div>
            </div>
            {onNavigate && (
              <button type="button" onClick={() => onNavigate("domain")} className="block mx-auto text-xs text-[var(--color-gold)] underline underline-offset-2">
                영역별 점수 자세히 보기 →
              </button>
            )}

            {(unknown1 || unknown2) && (
              <p className="text-[11px] text-[var(--color-ink-muted)] rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-ivory-warm)] px-3 py-2">
                🕰️ {unknown1 && unknown2 ? "두 분 모두" : unknown1 ? `${name1}님의` : `${name2}님의`} 출생시간이 없어 시주(時柱) 비교는 뺐어요. 세 기둥 기준 점수예요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
