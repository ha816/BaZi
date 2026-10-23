"use client";

import { useState } from "react";
import { RELATION_TYPE_LABEL } from "@/lib/constants";
import { getElementInfo } from "@/lib/elementColors";
import { charArtSrc, nextCharArtSrc } from "@/lib/characterArt";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import type { CompatTabProps } from "./types";

// 궁합 종합 — 2026-10-15 한눈에 탭을 빼면서 쪼갰다:
// RevealGate·CompatCharacterBox는 결과 직후 인트로(CompatIntro). 종합 궁합 점수 카드는 2026-10-18 제거 — 점수는 인트로·캐릭터 카드에

const FALLBACK_IMG = "/kkachi/good_kkachi.png";
const DRUMROLL_MS = 1200;

/** 공개 전 실루엣 한 장 — 그 사람의 사주 캐릭터 그림을 흐리게 미리 보여 주며(그림도 미리 받아 둔다) "?"를 겹친다. 분석 RevealGate(SajuCharacterCard)와 같은 모양 */
function Silhouette({ characterKey, artKey, rolling, delay }: { characterKey?: string | null; artKey?: string | null; rolling: boolean; delay?: string }) {
  const [src, setSrc] = useState(characterKey ? charArtSrc(artKey, characterKey) : FALLBACK_IMG);
  return (
    <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-gold-faint)] ${rolling ? "char-silhouette--shake" : "animate-float"}`} style={{ animationDelay: delay }}>
      <img src={src} alt="" className="w-full h-full object-cover char-silhouette" onError={() => setSrc((cur) => nextCharArtSrc(cur, characterKey, FALLBACK_IMG))} />
      <span className={`absolute inset-0 flex items-center justify-center font-heading text-5xl font-bold text-white/90 ${rolling ? "opacity-0" : ""} transition-opacity`} aria-hidden>?</span>
    </div>
  );
}

/** 공개 전 — "두근두근 ○○님과 ○○님의 궁합은?" + 두 사람 캐릭터 실루엣("?" 겹침 — 2026-10-18 분석 게이트와 같게, 드럼 까치 그림은 폐기) + 버튼 → 1.2초 드럼롤 후 공개 */
export function RevealGate({ name1, name2, roles, onReveal }: { name1: string; name2: string; roles: { character_key?: string | null; art_key?: string | null }[]; onReveal: () => void }) {
  const [rolling, setRolling] = useState(false);
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
      <div className="flex items-center gap-3">
        <Silhouette characterKey={roles[0]?.character_key} artKey={roles[0]?.art_key} rolling={rolling} />
        <span className="text-2xl text-[var(--color-gold-light)] heart-thump">♥</span>
        <Silhouette characterKey={roles[1]?.character_key} artKey={roles[1]?.art_key} rolling={rolling} delay="0.6s" />
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

/** 한 사람의 사주 캐릭터 그림(일간×강약 20유형, saju_character/{character_key}.webp — 분석 결과와 같은 파일). 파일이 없거나 옛 결과라 키가 없으면 역할 이모지 */
function Portrait({ characterKey, artKey, emoji, delay }: { characterKey?: string | null; artKey?: string | null; emoji: string; delay: string }) {
  // 여성판(art_key) → 유형 키 그림 → 역할 이모지 순으로 떨어진다
  const [src, setSrc] = useState<string | null>(characterKey ? charArtSrc(artKey, characterKey) : null);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-[min(8.5rem,16vh)] aspect-square rounded-2xl object-cover char-reveal"
        onError={() => setSrc((cur) => { const next = nextCharArtSrc(cur ?? "", characterKey, ""); return next || null; })}
      />
    );
  }
  return (
    <span className="w-[min(8.5rem,16vh)] aspect-square flex items-center justify-center text-5xl drum-beat" style={{ animationDuration: "1.6s", animationDelay: delay }} aria-hidden>
      {emoji}
    </span>
  );
}

/** 두 사람의 사주 캐릭터를 왼쪽 p1·오른쪽 p2로 나란히 + ♥ — 궁합 전용 그림(15종)은 만들지 않는다(2026-10-18, 사용자 결정). 인트로 상자·두 분의 캐릭터 카드·인트로 "펼치는 중" 화면이 같이 쓴다 */
export function PairArt({ roles }: { roles: { emoji: string; character_key?: string | null; art_key?: string | null }[] }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <Portrait characterKey={roles[0]?.character_key} artKey={roles[0]?.art_key} emoji={roles[0]?.emoji ?? "🐦"} delay="0s" />
      <span className="text-2xl text-[var(--color-gold-light)] heart-thump">♥</span>
      <Portrait characterKey={roles[1]?.character_key} artKey={roles[1]?.art_key} emoji={roles[1]?.emoji ?? "🐦"} delay="0.4s" />
    </div>
  );
}

/** 오행 캐릭터 상자(결과 직후 인트로) — 두 사람 사주 캐릭터 그림·"○○ 궁합 · 두 분은"·칭호·점수·각자 역할 칩·설명.
 *  폰 한 화면에 까치 인사·버튼까지 들어가게 촘촘하게. character 없는 옛 결과는 점수 + description */
export function CompatCharacterBox({ data, name1, name2, relationType, compact = false }: CompatTabProps & { compact?: boolean }) {
  // compact(두 분의 캐릭터 카드, 2026-10-18): 인트로에서 이미 본 "관계 유형 · 두 분은" 줄·점수·설명을 빼고 그림·칭호·역할 칩만 — 설명은 카드가 칩 위 까치 팁으로 보여 준다
  const ch = data.character;
  const fill = (t: string) => t.replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);
  const score = (
    <p className="font-heading text-lg font-bold text-[var(--color-ink)]">
      {data.total_score}<span className="text-sm font-normal text-[var(--color-ink-faint)]">점</span>
      <span className="ml-2 text-sm font-semibold text-[var(--color-gold)]">{data.label}</span>
    </p>
  );
  if (!ch) return <div className="text-center space-y-1">{score}<p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{data.description}</p></div>;
  return (
    <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-3 text-center space-y-2">
      <PairArt roles={ch.roles} />
      {!compact && <p className="text-[11px] font-semibold text-[var(--color-gold)]">{RELATION_TYPE_LABEL[relationType]} 궁합 · 두 분은</p>}
      <p className="font-heading text-xl font-bold leading-snug text-[var(--color-ink)] break-keep">{ch.title}</p>
      {!compact && score}
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
      {!compact && <p className="text-[13px] leading-relaxed text-[var(--color-ink)] break-keep">{fill(ch.desc)}</p>}
    </div>
  );
}

// 일간 오행 쌍의 관계 종류 이름표 — 해석 문장은 백엔드 desc가 든다
const KIND_LABEL: Record<string, string> = {
  generate: "한쪽이 다른 쪽을 키워 주는 상생(相生)",
  overcome: "한쪽이 다른 쪽을 다듬고 이끄는 상극(相剋)",
  same: "닮은 기운이 나란히 선 비화(比和)",
};

/** 두 분의 캐릭터 카드 — 성격 탭 맨 위(2026-10-18; 10-17엔 팔자비교 탭 기둥 비교 다음). 인트로(CompatIntro)에서 본 칭호·역할·설명을 탭에서도 —
 *  인트로를 건너뛰거나 ?tab=으로 다시 열어도 여기서 본다. 인트로에서 이미 공개한 것이라 "확인하기" 게이트 없이 바로 보여준다.
 *  상자는 compact(관계 유형 줄·점수·설명 없음 — 인트로에서 본 것), 설명은 칩 위 까치 팁. 잘 맞는 순간 | 부딪히기 쉬운 순간 칩(백엔드 moments 3+3)은 분석 카드의 선호하는 일 | 선호하지 않는 일에 대응 — 인트로 상자에는 넣지 않는다(한 화면) */
export function CompatCharacterCard(props: CompatTabProps) {
  const { data, name1, name2 } = props;
  const ch = data.character;
  if (!ch) return null;
  const [r1, r2] = ch.roles;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="두 분의 캐릭터">
        <p>두 분의 <strong className="text-[var(--color-ink)]">일간(日干)</strong> 오행 짝으로 뽑은 궁합 캐릭터예요. 한쪽이 키워 주면 상생(相生), 다듬고 이끌면 상극(相剋), 같은 기운이면 비화(比和) — 그 안의 15가지 비유 중 하나가 두 분의 칭호예요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        {r1 && r2 && (
          <KkachiTip>
            {`${name1}님은 ${r1.emoji} **${r1.name}**, ${name2}님은 ${r2.emoji} **${r2.name}** — ${KIND_LABEL[ch.kind] ?? "서로 다른 기운이 만난"} 사이예요.`}
          </KkachiTip>
        )}
        <CompatCharacterBox {...props} compact />
        {/* 설명은 상자 안이 아니라 까치 팁으로, 잘 맞는 순간 칩 바로 위에 (2026-10-18, 사용자 지시) */}
        <KkachiTip>{ch.desc.replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2)}</KkachiTip>
        {ch.moments && (
          <div className="grid grid-cols-2 rounded-xl border border-[var(--color-border-light)] divide-x divide-[var(--color-border-light)] text-center">
            <div className="px-2 py-2.5">
              <p className="text-[11px] font-semibold mb-1.5 text-[var(--color-gold)]">잘 맞는 순간</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {ch.moments.good.map((m) => (
                  <span key={m} className="rounded-full px-2.5 py-1 text-[11px] font-semibold break-keep text-[var(--color-gold)] bg-[var(--color-gold-faint)] border border-[var(--color-gold-light)]">{m}</span>
                ))}
              </div>
            </div>
            <div className="px-2 py-2.5">
              <p className="text-[11px] font-semibold mb-1.5 text-[var(--color-ink-muted)]">부딪히기 쉬운 순간</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {ch.moments.hard.map((m) => (
                  <span key={m} className="rounded-full px-2.5 py-1 text-[11px] break-keep text-[var(--color-ink-muted)] bg-[var(--color-parchment)] border border-[var(--color-border-light)]">{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
