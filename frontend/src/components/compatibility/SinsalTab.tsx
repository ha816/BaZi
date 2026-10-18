import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import { SINSAL_INFO } from "../tabs/natal/data";
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

/** 신살 — 까치 팁(함께·각자 가진 신살 개수) · 함께 가진 신살(같은 기운) · 한쪽만 가진 신살(상대를 받쳐주는 자리). 십이신살은 2026-10-18 궁합에서 뺐다 — 신살 카드와 네 별이 겹치고 나머지는 관계 정보가 얇다(각자 것은 분석 만세력에서, 사용자 결정).
 *  2026-10-18: "귀인·신살" 소제목, 그룹 제목 옆 소제목("두 분이 같은 기운"·"○○님을 받쳐주는 자리"), 카드마다 붙던 "★ 함께"·"○○님" 배지, 설명 앞의 "○○님이 ○○님에게"는 까치 팁·그룹 제목과 겹쳐서 뺐다 */
export default function SinsalTab({ data, name1, name2 }: CompatTabProps) {
  const { shared_sinsal, unique_sinsal_1, unique_sinsal_2 } = data;
  const empty = shared_sinsal.length === 0 && unique_sinsal_1.length === 0 && unique_sinsal_2.length === 0;
  const tip = `${shared_sinsal.length > 0 ? `두 분이 함께 가진 신살은 **${shared_sinsal.join("·")}**이고, ` : "두 분이 함께 가진 신살은 없고, "}${name1}님만 가진 신살이 ${unique_sinsal_1.length}개, ${name2}님만 가진 신살이 ${unique_sinsal_2.length}개예요. 함께 가진 건 같은 기운, 한쪽만 가진 건 그 분이 상대를 받쳐주는 자리예요.`;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신살(神殺)">
        <p>사주에 깃든 특별한 기운이에요. 옛날엔 길흉으로 봤지만 지금은 <strong>캐릭터와 역량</strong>으로 읽어요. 함께 가진 신살은 두 분이 같은 기운을 지녔다는 뜻, 한쪽만 가진 신살은 그 분이 그 영역에서 상대를 받쳐 준다는 뜻이에요.</p>
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
