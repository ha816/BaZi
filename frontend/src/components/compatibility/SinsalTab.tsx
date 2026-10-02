import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import { PILLAR_LABELS_SHORT, SIBI_SINSAL_INFO, SINSAL_INFO } from "../tabs/natal/data";
import type { CompatTabProps } from "./types";

const SHARED_SINSAL_MEANING: Record<string, string> = {
  "천을귀인": "위기 순간 서로를 지켜주는 강력한 인연",
  "월덕귀인": "갈등 없이 평화롭게 흐르는 사이",
  "천덕귀인": "복이 두텁게 깃든 행운의 결합",
  "도화살": "이성적 매력이 강한 화려한 인연",
  "역마살": "함께 움직이고 변화를 즐기는 활동적 인연",
  "화개살": "예술·종교·학문 코드가 깊게 통하는 정신적 인연",
  "백호살": "에너지가 강해 함께 큰일을 도모하는 인연",
  "장성살": "리더십과 야망이 통하는 카리스마 커플",
  "문창귀인": "학문·문서 코드가 통해 함께 성장하는 인연",
};

const UNIQUE_SINSAL_ROLE: Record<string, string> = {
  "천을귀인": "위기 때 든든하게 지켜주는 자리",
  "월덕귀인": "갈등을 부드럽게 조율해주는 자리",
  "천덕귀인": "복을 끌어와 함께 누리게 하는 자리",
  "도화살": "이성적 매력을 더해주는 자리",
  "역마살": "새로운 기회·이동을 끌어오는 자리",
  "화개살": "예술·정신적 깊이를 더해주는 자리",
  "백호살": "강한 추진력으로 일을 밀어붙이는 자리",
  "장성살": "방향을 잡고 이끌어주는 리더 자리",
  "문창귀인": "공부·문서·전문성을 받쳐주는 자리",
};

interface SinsalCardProps {
  name: string;
  badge: string;
  accent: { bg: string; border: string; badgeBg: string; badgeColor: string; footColor: string };
  footer?: string;
}

function SinsalCard({ name, badge, accent, footer }: SinsalCardProps) {
  const info = SINSAL_INFO[name];
  return (
    <div
      className="rounded-lg border p-2.5 flex gap-2.5"
      style={{ background: accent.bg, borderColor: accent.border }}
    >
      <img
        src={`/kkachi/sinsal/sinsal_${name}.png`}
        alt={name}
        className="w-20 h-20 md:w-24 md:h-24 rounded-md object-cover flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: accent.badgeBg, color: accent.badgeColor }}
          >
            {badge}
          </span>
          <span className="text-sm md:text-xs font-bold text-[var(--color-ink)]">
            {name}
            {info?.hanja && (
              <span className="font-normal text-[var(--color-ink-faint)] ml-1">({info.hanja})</span>
            )}
          </span>
        </div>
        {info?.tagline && (
          <p className="text-xs md:text-[10px] font-medium text-[var(--color-ink-muted)] leading-snug">
            {info.tagline}
          </p>
        )}
        {info?.desc && (
          <p className="text-xs md:text-[10px] text-[var(--color-ink-muted)] leading-snug">{info.desc}</p>
        )}
        {footer && (
          <p className="text-xs md:text-[10px] font-semibold leading-snug" style={{ color: accent.footColor }}>
            → {footer}
          </p>
        )}
      </div>
    </div>
  );
}

const SHARED_ACCENT = {
  bg: "#dcfce7",
  border: "#86efac",
  badgeBg: "#15803d",
  badgeColor: "#ffffff",
  footColor: "#15803d",
};

const PERSON1_ACCENT = {
  bg: "#fef3c7",
  border: "#fbbf24",
  badgeBg: "#f59e0b",
  badgeColor: "#ffffff",
  footColor: "#b45309",
};

const PERSON2_ACCENT = {
  bg: "#ccfbf1",
  border: "#5eead4",
  badgeBg: "#14b8a6",
  badgeColor: "#ffffff",
  footColor: "#0f766e",
};

/** 신살 — 함께 가진 신살(같은 기운) · 한쪽만 가진 신살(상대를 받쳐주는 자리) · 두 사람 십이신살 비교 */
export default function SinsalTab({ data, name1, name2 }: CompatTabProps) {
  const { shared_sinsal, unique_sinsal_1, unique_sinsal_2 } = data;
  const s1 = data.pillar1_snapshot?.sibi_sinsal ?? [];
  const s2 = data.pillar2_snapshot?.sibi_sinsal ?? [];
  const hasSibi = s1.some(Boolean) || s2.some(Boolean);
  // 시주 미상이면 3칸, 아니면 4칸 — 둘 중 긴 쪽 기준
  const cols = Math.max(s1.length, s2.length);
  const sharedSibi = [...new Set(s1.filter(Boolean))].filter((n) => s2.includes(n));
  const empty = shared_sinsal.length === 0 && unique_sinsal_1.length === 0 && unique_sinsal_2.length === 0 && !hasSibi;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신살(神殺)">
        <p>신살(神殺)은 사주에 깃든 특별한 기운으로, 옛날에는 길흉으로 봤지만 현대에는 <strong>개인의 캐릭터·역량</strong>으로 풀이해요. <strong>함께 가진 신살</strong>은 두 분이 같은 기운을 지녔다는 뜻이고, <strong>한쪽만 가진 신살</strong>은 그 분이 그 영역에서 상대를 받쳐주는 자리예요. <strong>십이신살(十二神殺)</strong>은 년지를 기준으로 각 기둥에 붙는 열두 가지 기운이에요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        {empty ? (
          <KkachiTip>두 분이 가진 신살(神殺)이 없어 보여줄 카드가 없어요. 신살이 없다고 궁합이 나쁜 건 아니에요.</KkachiTip>
        ) : (
          <>
            <KkachiTip>함께 가진 신살은 두 분이 나누는 같은 기운, 한쪽만 가진 신살은 그 분이 상대를 받쳐주는 자리예요.</KkachiTip>

            {(shared_sinsal.length > 0 || unique_sinsal_1.length > 0 || unique_sinsal_2.length > 0) && (
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                귀인·신살 <span className="text-[11px] font-normal text-[var(--color-ink-faint)] ml-1">일간·일지 기준으로 붙는 특별한 기운</span>
              </p>
            )}

            {shared_sinsal.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  함께 가진 신살 <span className="font-normal text-[var(--color-ink-faint)] ml-1">두 분이 같은 기운</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {shared_sinsal.map((s) => (
                    <SinsalCard
                      key={s}
                      name={s}
                      badge="★ 함께"
                      accent={SHARED_ACCENT}
                      footer={SHARED_SINSAL_MEANING[s]}
                    />
                  ))}
                </div>
              </div>
            )}

            {unique_sinsal_1.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  {name1}님만 가진 신살
                  <span className="font-normal text-[var(--color-ink-faint)] ml-1">{name2}님을 받쳐주는 자리</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unique_sinsal_1.map((s) => {
                    const role = UNIQUE_SINSAL_ROLE[s];
                    return (
                      <SinsalCard
                        key={s}
                        name={s}
                        badge={`${name1}님`}
                        accent={PERSON1_ACCENT}
                        footer={role ? `${name1}님이 ${name2}님에게 ${role}` : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {unique_sinsal_2.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  {name2}님만 가진 신살
                  <span className="font-normal text-[var(--color-ink-faint)] ml-1">{name1}님을 받쳐주는 자리</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unique_sinsal_2.map((s) => {
                    const role = UNIQUE_SINSAL_ROLE[s];
                    return (
                      <SinsalCard
                        key={s}
                        name={s}
                        badge={`${name2}님`}
                        accent={PERSON2_ACCENT}
                        footer={role ? `${name2}님이 ${name1}님에게 ${role}` : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {hasSibi && (
              <div className="space-y-2 pt-2 border-t border-[var(--color-border-light)]">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  십이신살(十二神殺) <span className="text-[11px] font-normal text-[var(--color-ink-faint)] ml-1">년지 기준, 기둥마다 하나씩</span>
                </p>
                <div className="overflow-hidden rounded-xl border border-[var(--color-border-light)]">
                  <div className="grid text-center text-[10px] text-[var(--color-ink-faint)] bg-[var(--color-ivory-warm)]" style={{ gridTemplateColumns: `3.5rem repeat(${cols}, minmax(0, 1fr))` }}>
                    <div className="py-1.5" />
                    {Array.from({ length: cols }, (_, i) => <div key={i} className="py-1.5">{PILLAR_LABELS_SHORT[i]}</div>)}
                  </div>
                  {[{ name: name1, list: s1, other: s2 }, { name: name2, list: s2, other: s1 }].map(({ name, list, other }, row) => (
                    <div key={row} className="grid text-center border-t border-[var(--color-border-light)]" style={{ gridTemplateColumns: `3.5rem repeat(${cols}, minmax(0, 1fr))` }}>
                      <div className="py-2 text-[10px] font-semibold text-[var(--color-ink-muted)] truncate px-1 self-center">{name}님</div>
                      {Array.from({ length: cols }, (_, i) => {
                        const n = list[i] ?? "";
                        const same = !!n && other.includes(n);
                        return (
                          <div key={i} className={`py-2 px-0.5 ${same ? "bg-emerald-50" : ""}`}>
                            {n ? (
                              <>
                                <p className={`text-xs font-semibold leading-tight ${same ? "text-emerald-700" : "text-[var(--color-ink)]"}`}>{n}</p>
                                {SIBI_SINSAL_INFO[n] && <p className="text-[9px] text-[var(--color-ink-faint)]">({SIBI_SINSAL_INFO[n].hanja})</p>}
                              </>
                            ) : <p className="text-xs text-[var(--color-ink-faint)]">—</p>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {sharedSibi.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-[var(--color-ink-muted)]">두 분이 같은 기운 <span className="text-[var(--color-ink-faint)]">(초록 칸)</span></p>
                    {sharedSibi.map((n) => (
                      <div key={n} className="flex items-baseline gap-2 text-xs">
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">{n}</span>
                        <span className="text-[var(--color-ink-muted)]">{SIBI_SINSAL_INFO[n]?.meaning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--color-ink-faint)]">두 분의 십이신살은 겹치지 않아요 — 서로 다른 기운으로 채워주는 사이예요.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
