import type { NatalResult, PostnatalResult, ClashInfo, CombineInfo } from "@/types/analysis";
import { getElementInfo, ganjiToElements } from "@/lib/elementColors";
import DaeunTimeline from "@/components/DaeunTimeline";
import InterpretSection from "@/components/InterpretSection";
import DetailToggle from "@/components/DetailToggle";
import PillarDetail from "@/components/PillarDetail";

const SAMJAE_STYLE: Record<string, { borderColor: string; labelColor: string; bgColor: string }> = {
  "눌삼재": { borderColor: "var(--color-fire)",  labelColor: "var(--color-fire)",  bgColor: "#F7EDEC" },
  "들삼재": { borderColor: "var(--color-earth)", labelColor: "var(--color-earth)", bgColor: "#F5F0E7" },
  "날삼재": { borderColor: "var(--color-earth)", labelColor: "var(--color-earth)", bgColor: "#F5F0E7" },
};

const SIPSIN_ARROW: Record<string, { label: string; dir: "to-me" | "from-me" | "same"; color: string }> = {
  "比肩": { label: "같은 기운", dir: "same",    color: "#78716C" },
  "劫財": { label: "같은 기운", dir: "same",    color: "#78716C" },
  "食神": { label: "내가 낳음", dir: "from-me", color: "#1B6B3A" },
  "傷官": { label: "내가 낳음", dir: "from-me", color: "#1B6B3A" },
  "偏財": { label: "내가 꺾음", dir: "from-me", color: "#B02020" },
  "正財": { label: "내가 꺾음", dir: "from-me", color: "#B02020" },
  "偏官": { label: "나를 꺾음", dir: "to-me",   color: "#B02020" },
  "正官": { label: "나를 꺾음", dir: "to-me",   color: "#B02020" },
  "偏印": { label: "나를 키움", dir: "to-me",   color: "#1B6B3A" },
  "正印": { label: "나를 키움", dir: "to-me",   color: "#1B6B3A" },
};

const SIPSIN_YIN_YANG: Record<string, string> = {
  "比肩": "음양 같음",  "劫財": "음양 다름",
  "食神": "음양 같음",  "傷官": "음양 다름",
  "偏財": "음양 같음",  "正財": "음양 다름",
  "偏官": "음양 같음",  "正官": "음양 다름",
  "偏印": "음양 같음",  "正印": "음양 다름",
};

interface SipsinDiagramProps {
  dayStem: string;
  dayStemElement: string;
  targetChar: string;
  targetElement: string;
  sipsinName: string;
  domain: string;
  label: string;
}

function SipsinDiagram({ dayStem, dayStemElement, targetChar, targetElement, sipsinName, domain, label }: SipsinDiagramProps) {
  const arrow = SIPSIN_ARROW[sipsinName] ?? { label: "→", dir: "from-me", color: "#78716C" };
  const yinYang = SIPSIN_YIN_YANG[sipsinName] ?? "";
  const stemInfo = getElementInfo(dayStemElement);
  const targetInfo = getElementInfo(targetElement);

  const leftChip = arrow.dir === "to-me" ? targetChar : dayStem;
  const leftInfo = arrow.dir === "to-me" ? targetInfo : stemInfo;
  const leftSub = arrow.dir === "to-me" ? targetElement : dayStemElement;
  const rightChip = arrow.dir === "to-me" ? dayStem : targetChar;
  const rightInfo = arrow.dir === "to-me" ? stemInfo : targetInfo;
  const rightSub = arrow.dir === "to-me" ? dayStemElement : targetElement;

  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] px-4 py-3">
      <div className="text-[10px] text-[var(--color-ink-faint)] mb-2">{label}</div>
      <div className="flex items-center gap-2">
        {/* 왼쪽 글자 chip */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center"
            style={{ backgroundColor: leftInfo.bgColor, border: `1.5px solid ${leftInfo.borderColor}` }}>
            <span className="font-heading text-xl font-bold leading-none" style={{ color: leftInfo.color }}>{leftChip}</span>
            <span className="text-[9px] mt-0.5" style={{ color: leftInfo.color }}>{leftSub}</span>
          </div>
          <span className="text-[9px] text-[var(--color-ink-faint)] mt-1">
            {arrow.dir === "to-me" ? "대운" : "일간"}
          </span>
        </div>

        {/* 관계 화살표 */}
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold" style={{ color: arrow.color }}>{arrow.label}</span>
          <div className="w-full h-px" style={{ backgroundColor: arrow.color, opacity: 0.4 }} />
          <span className="text-[9px]" style={{ color: arrow.color }}>→</span>
        </div>

        {/* 오른쪽 글자 chip */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center"
            style={{ backgroundColor: rightInfo.bgColor, border: `1.5px solid ${rightInfo.borderColor}` }}>
            <span className="font-heading text-xl font-bold leading-none" style={{ color: rightInfo.color }}>{rightChip}</span>
            <span className="text-[9px] mt-0.5" style={{ color: rightInfo.color }}>{rightSub}</span>
          </div>
          <span className="text-[9px] text-[var(--color-ink-faint)] mt-1">
            {arrow.dir === "to-me" ? "일간" : "대운"}
          </span>
        </div>

        {/* 결과 */}
        <div className="flex flex-col items-center ml-1">
          <span className="text-[10px] text-[var(--color-ink-faint)] mb-1">=</span>
          <div className="rounded-lg px-2.5 py-1.5 text-center"
            style={{ backgroundColor: "#FFF8EC", border: "1.5px solid var(--color-gold)" }}>
            <span className="font-heading text-base font-bold text-[var(--color-gold)]">{sipsinName}</span>
          </div>
          <span className="text-[9px] text-[var(--color-ink-faint)] mt-1 max-w-[64px] text-center leading-tight">{yinYang}</span>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-[var(--color-ink-faint)]">키워드 {domain}</div>
    </div>
  );
}

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "태어난 해", "월주": "태어난 달", "일주": "태어난 날", "시주": "태어난 시간",
};

function pillarLabel(pillar: string): string {
  return PILLAR_LABEL_MAP[pillar] ?? pillar;
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function DaeunTab({ natal, postnatal }: Props) {
  const currentDaeun = postnatal.daeun.find(d => d.is_current) ?? null;
  const nextDaeun = postnatal.daeun.find(d => d.start_age > (currentDaeun?.end_age ?? 0)) ?? null;

  const seunEls = ganjiToElements(postnatal.seun_ganji);
  const seunStemInfo = getElementInfo(seunEls.stem);
  const seunBranchInfo = getElementInfo(seunEls.branch);

  return (
    <div className="space-y-4">
      {/* 삼재 배너 */}
      {postnatal.samjae && (() => {
        const s = SAMJAE_STYLE[postnatal.samjae!.type] ?? SAMJAE_STYLE["들삼재"];
        return (
          <div className="slide-card overflow-hidden">
            <div className="px-5 py-4" style={{ backgroundColor: s.bgColor, borderLeft: `4px solid ${s.borderColor}` }}>
              <p className="text-sm font-bold mb-1" style={{ color: s.labelColor }}>
                삼재(三災) — {postnatal.samjae!.type}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                올해({postnatal.samjae!.year_branch}年)는 {postnatal.samjae!.birth_branch}生에게 삼재에 해당하는 해예요.
              </p>
            </div>
          </div>
        );
      })()}

      {/* 현재 나의 대운 */}
      {currentDaeun && (() => {
        return (
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">대운(大運)</h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">10년 주기로 바뀌는 큰 운의 흐름</p>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <div className="mb-5">
                <PillarDetail pillars={natal.pillars} dayStem={natal.day_stem} basic highlightDayStem />
              </div>
              {postnatal.daeun_sipsin.length >= 2 && (
                <div className="mb-5 space-y-2">
                  <SipsinDiagram
                    label="천간 십신(天干 十神) — 어떻게 계산되나요?"
                    dayStem={natal.day_stem}
                    dayStemElement={natal.my_element.name}
                    targetChar={postnatal.daeun_sipsin[0].char}
                    targetElement={postnatal.daeun_sipsin[0].element}
                    sipsinName={postnatal.daeun_sipsin[0].sipsin_name}
                    domain={postnatal.daeun_sipsin[0].domain}
                  />
                  <SipsinDiagram
                    label="지지 십신(地支 十神) — 같은 원리로 계산해요"
                    dayStem={natal.day_stem}
                    dayStemElement={natal.my_element.name}
                    targetChar={postnatal.daeun_sipsin[1].char}
                    targetElement={postnatal.daeun_sipsin[1].element}
                    sipsinName={postnatal.daeun_sipsin[1].sipsin_name}
                    domain={postnatal.daeun_sipsin[1].domain}
                  />
                </div>
              )}
              {/* 다음 대운 예고 */}
              {nextDaeun && (
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-light)]">
                  <span className="text-xs text-[var(--color-ink-faint)]">다음 대운</span>
                  <span className="font-heading text-base font-bold text-[var(--color-ink-muted)]">{nextDaeun.ganji}</span>
                  <span className="text-xs text-[var(--color-ink-faint)]">{nextDaeun.start_age}~{nextDaeun.end_age}세</span>
                  {nextDaeun.has_yongshin && (
                    <span className="text-xs font-medium text-[var(--color-wood)]">좋은 기운</span>
                  )}
                </div>
              )}
              {/* 대운 충합 표시 */}
              {(postnatal.daeun_clashes.length > 0 || postnatal.daeun_combines.length > 0) && (
                <div className="border-t border-[var(--color-border-light)] pt-3 mt-3 space-y-1.5">
                  {postnatal.daeun_clashes.map((c: ClashInfo, i: number) => (
                    <p key={i} className="text-xs text-[var(--color-ink-faint)]">
                      <span className="font-medium" style={{ color: "var(--color-fire)" }}>긴장 </span>
                      현재 대운 기운이 내 사주 {pillarLabel(c.pillar)} 자리와 긴장 관계예요.
                    </p>
                  ))}
                  {postnatal.daeun_combines.map((c: CombineInfo, i: number) => (
                    <p key={i} className="text-xs text-[var(--color-ink-faint)]">
                      <span className="font-medium" style={{ color: "var(--color-wood)" }}>흐름 </span>
                      현재 대운 기운이 내 사주 {pillarLabel(c.pillar)} 자리와 좋은 흐름이에요.
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 올해 세운 — 시각 카드 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">올해 세운(歲運)</h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{postnatal.seun_ganji}</p>
            </div>
            {postnatal.yongshin_in_seun && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#EEF4F0", color: "var(--color-wood)", border: "1px solid #C1D6C8" }}>
                용신 포함 ✓
              </span>
            )}
          </div>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="flex items-start gap-5 mb-4">
            <div className="flex-shrink-0 flex gap-1">
              {[
                { char: postnatal.seun_ganji[0], info: seunStemInfo,   sub: "하늘", sipsin: postnatal.seun_stem },
                { char: postnatal.seun_ganji[1], info: seunBranchInfo, sub: "땅",   sipsin: postnatal.seun_branch },
              ].map(({ char, info, sub, sipsin }) => (
                <div key={sub}
                  className="w-16 rounded-xl flex flex-col items-center py-3 gap-0.5"
                  style={{ backgroundColor: info.bgColor, border: `1.5px solid ${info.borderColor}` }}
                >
                  <span className="text-[10px] text-[var(--color-ink-faint)]">{sub}</span>
                  <span className="font-heading text-3xl font-bold leading-none" style={{ color: info.color }}>{char}</span>
                  <span className="text-[11px]" style={{ color: info.color }}>{info.korean}</span>
                  <span className="text-[10px] text-[var(--color-ink-faint)] mt-0.5">{sipsin.sipsin_name}</span>
                  <span className="text-[10px] text-[var(--color-ink-faint)]">{sipsin.domain}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-2">
              {postnatal.seun_clashes.map((c: ClashInfo, i: number) => (
                <div key={i} className="rounded-lg px-3 py-2.5 bg-[var(--color-ivory)]"
                  style={{ borderLeft: "3px solid var(--color-fire)" }}>
                  <p className="text-xs text-[var(--color-ink-light)] leading-relaxed">
                    올해 기운이 내 사주 {pillarLabel(c.pillar)} 자리와 부딪혀요.
                  </p>
                </div>
              ))}
              {postnatal.seun_combines.map((c: CombineInfo, i: number) => (
                <div key={i} className="rounded-lg px-3 py-2.5 bg-[var(--color-ivory)]"
                  style={{ borderLeft: "3px solid var(--color-wood)" }}>
                  <p className="text-xs text-[var(--color-ink-light)] leading-relaxed">
                    올해 기운이 내 사주 {pillarLabel(c.pillar)} 자리와 잘 어울려요.
                  </p>
                </div>
              ))}
            </div>
          </div>
          <DetailToggle label="세운 상세 보기">
            <InterpretSection title="" blocks={postnatal.annual_fortune} />
          </DetailToggle>
        </div>
      </div>

      {/* 전체 대운 흐름 타임라인 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
            전체 흐름
            <span className="text-xs font-normal text-[var(--color-ink-faint)] ml-2">10년 주기</span>
          </h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <DaeunTimeline daeun={postnatal.daeun} />
        </div>
      </div>

      {/* 인생 흐름 상세 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">인생 흐름 상세</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.major_fortune} />
        </div>
      </div>
    </div>
  );
}