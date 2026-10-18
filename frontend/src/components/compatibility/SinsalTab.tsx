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

// 두 분이 같은 십이신살을 지녔을 때 — 그 기운이 관계에서 어떻게 드러나는지 한 줄 (SIBI_SINSAL_INFO.meaning은 개인 키워드)
const SHARED_SIBI_MEANING: Record<string, string> = {
  "겁살": "둘 다 승부욕과 결단이 강해 밀어붙일 때 잘 통하지만, 부딪히면 세게 부딪혀요",
  "재살": "둘 다 경계심이 있고 신중해서 위기 때 서로를 지켜 주는 사이예요",
  "천살": "둘 다 큰 흐름 앞에서 겸손해지는 기운 — 어려운 시기를 함께 견디는 힘이 있어요",
  "지살": "둘 다 움직이고 옮기는 걸 즐겨서 여행·이사 같은 변화를 함께 꾸미기 좋아요",
  "년살": "둘 다 사람을 끄는 매력이 있어 함께 있으면 더 빛나지만, 주변의 시선도 같이 받아요",
  "월살": "둘 다 안으로 힘을 모으는 기운 — 조용히 함께 준비하는 시간이 잘 맞아요",
  "망신살": "둘 다 자기 표현이 강해 솔직한 대화가 잘 통하되, 체면 문제엔 같이 예민해요",
  "장성살": "둘 다 이끄는 기운이 세서 큰일을 함께 도모하기 좋지만, 주도권은 나눠 가져야 해요",
  "반안살": "둘 다 안정과 성취를 향해 차근차근 올라가는 쪽이라 긴 호흡이 잘 맞아요",
  "역마살": "둘 다 떠나고 움직이는 기운 — 함께 다니는 시간이 관계를 키워요",
  "육해살": "둘 다 예민하게 살피는 기운이라 서로의 작은 변화를 잘 알아채요",
  "화개살": "둘 다 예술·정신적 깊이가 있어 취향과 대화 코드가 깊게 통해요",
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
  accent: { bg: string; border: string; footColor: string };
  footer?: string;
}

function SinsalCard({ name, accent, footer }: SinsalCardProps) {
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

// 그룹마다 색만 다르게 — 누구 것인지는 그룹 제목이 말하므로 카드에 배지를 붙이지 않는다(2026-10-18)
const SHARED_ACCENT = { bg: "#dcfce7", border: "#86efac", footColor: "#15803d" };

const PERSON1_ACCENT = { bg: "#fef3c7", border: "#fbbf24", footColor: "#b45309" };

const PERSON2_ACCENT = { bg: "#ccfbf1", border: "#5eead4", footColor: "#0f766e" };

/** 신살 — 까치 팁(함께·각자 가진 신살 개수) · 함께 가진 신살(같은 기운) · 한쪽만 가진 신살(상대를 받쳐주는 자리). 십이신살은 2026-10-18 아래 SibiSinsalCard로 분리.
 *  2026-10-18: "귀인·신살" 소제목, 그룹 제목 옆 소제목("두 분이 같은 기운"·"○○님을 받쳐주는 자리"), 카드마다 붙던 "★ 함께"·"○○님" 배지, 설명 앞의 "○○님이 ○○님에게"는 까치 팁·그룹 제목과 겹쳐서 뺐다 */
export default function SinsalTab({ data, name1, name2 }: CompatTabProps) {
  const { shared_sinsal, unique_sinsal_1, unique_sinsal_2 } = data;
  const empty = shared_sinsal.length === 0 && unique_sinsal_1.length === 0 && unique_sinsal_2.length === 0;
  const tip = `${shared_sinsal.length > 0 ? `두 분이 함께 가진 신살은 **${shared_sinsal.join("·")}**이고, ` : "두 분이 함께 가진 신살은 없고, "}${name1}님만 가진 신살이 ${unique_sinsal_1.length}개, ${name2}님만 가진 신살이 ${unique_sinsal_2.length}개예요. 함께 가진 건 같은 기운, 한쪽만 가진 건 그 분이 상대를 받쳐주는 자리예요.`;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신살(神殺)">
        <p>신살(神殺)은 사주에 깃든 특별한 기운으로, 옛날에는 길흉으로 봤지만 현대에는 <strong>개인의 캐릭터·역량</strong>으로 풀이해요. <strong>함께 가진 신살</strong>은 두 분이 같은 기운을 지녔다는 뜻이고, <strong>한쪽만 가진 신살</strong>은 그 분이 그 영역에서 상대를 받쳐주는 자리예요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        {empty ? (
          <KkachiTip>두 분이 가진 귀인·신살이 없어 보여줄 카드가 없어요. 신살이 없다고 궁합이 나쁜 건 아니에요.</KkachiTip>
        ) : (
          <>
            <KkachiTip>{tip}</KkachiTip>

            {shared_sinsal.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  함께 가진 신살
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {shared_sinsal.map((s) => (
                    <SinsalCard
                      key={s}
                      name={s}
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
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unique_sinsal_1.map((s) => {
                    const role = UNIQUE_SINSAL_ROLE[s];
                    return (
                      <SinsalCard
                        key={s}
                        name={s}
                        accent={PERSON1_ACCENT}
                        footer={role}
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
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unique_sinsal_2.map((s) => {
                    const role = UNIQUE_SINSAL_ROLE[s];
                    return (
                      <SinsalCard
                        key={s}
                        name={s}
                        accent={PERSON2_ACCENT}
                        footer={role}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}

/** 십이신살(十二神殺) — 신살 카드에서 분리(2026-10-18). 상세 설명(년지 기준 열두 기운·기둥 자리의 뜻) + 까치 팁(두 분이 함께 지닌 십이신살과 그 뜻)
 *  + 기둥별 비교표(같은 기운은 초록 칸) + 함께 지닌 기운마다 관계 풀이 한 줄. 스냅샷에 sibi_sinsal이 없는 옛 결과면 카드 없음 */
export function SibiSinsalCard({ data, name1, name2 }: CompatTabProps) {
  const s1 = data.pillar1_snapshot?.sibi_sinsal ?? [];
  const s2 = data.pillar2_snapshot?.sibi_sinsal ?? [];
  if (!s1.some(Boolean) && !s2.some(Boolean)) return null;
  // 시주 미상이면 3칸, 아니면 4칸 — 둘 중 긴 쪽 기준
  const cols = Math.max(s1.length, s2.length);
  const sharedSibi = [...new Set(s1.filter(Boolean))].filter((n) => s2.includes(n));
  const tip = sharedSibi.length > 0
    ? `두 분이 함께 지닌 십이신살은 **${sharedSibi.map((n) => `${n}(${SIBI_SINSAL_INFO[n]?.hanja ?? ""})`).join("·")}**이에요. 같은 십이신살을 둘 다 가지면 그 기운이 두 분 사이에서 더 또렷해져요 — 비슷한 상황에서 비슷하게 움직이고, 그 영역에서 서로를 잘 이해해요. 아래 표의 초록 칸이에요.`
    : `두 분의 십이신살은 겹치지 않아요. 같은 기운은 없지만 각자 다른 자리의 기운으로 서로를 채워주는 사이예요. 표에서 ${name1}님과 ${name2}님의 기둥마다 어떤 기운이 흐르는지 나란히 비교해 보세요.`;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="십이신살(十二神殺)">
        <p>
          십이신살(十二神殺)은 <strong>태어난 해의 띠(년지)</strong>를 기준으로 열두 지지마다 하나씩 붙는 열두 가지 기운이에요 — 겁살·재살·천살·지살·년살·월살·망신살·장성살·반안살·역마살·육해살·화개살.
          네 기둥(년·월·일·시)에 하나씩 붙어서, 각 기둥이 뜻하는 자리(년주 조상·초년, 월주 부모·사회, 일주 나·배우자, 시주 자식·말년)에 어떤 기운이 흐르는지 봐요.
          이름에 살(殺)이 붙지만 나쁜 뜻만은 아니고 <strong>그 자리의 성향과 리듬</strong>으로 읽어요. 두 분이 같은 십이신살을 지니면 그 기운을 둘 다 가진 셈이라, 비슷한 상황에서 비슷하게 움직이고 그 영역에서 서로를 잘 이해해요.
        </p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>{tip}</KkachiTip>
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
        {sharedSibi.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-[var(--color-ink-muted)]">두 분이 함께 지닌 기운 <span className="text-[var(--color-ink-faint)]">(초록 칸)</span></p>
            {sharedSibi.map((n) => (
              <div key={n} className="flex items-baseline gap-2 text-xs">
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">{n}</span>
                <span className="text-[var(--color-ink-muted)] break-keep">{SHARED_SIBI_MEANING[n] ?? SIBI_SINSAL_INFO[n]?.meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
