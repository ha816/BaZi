import type { NatalResult, PostnatalResult, SipsinInfo, ClashInfo, CombineInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import DomainBarChart from "@/components/DomainBarChart";
import InterpretSection from "@/components/InterpretSection";
import DetailToggle from "@/components/DetailToggle";
import TermBadge from "@/components/TermBadge";

const SAMJAE_STYLE: Record<string, { borderColor: string; labelColor: string; bgColor: string }> = {
  "눌삼재": { borderColor: "var(--color-fire)",  labelColor: "var(--color-fire)",  bgColor: "#F7EDEC" },
  "들삼재": { borderColor: "var(--color-earth)", labelColor: "var(--color-earth)", bgColor: "#F5F0E7" },
  "날삼재": { borderColor: "var(--color-earth)", labelColor: "var(--color-earth)", bgColor: "#F5F0E7" },
};

const SIPSIN_YEAR_DESC: Record<string, string> = {
  "比肩": "나와 비슷한 기운이 들어와요. 경쟁이 늘거나 동료·친구와의 인연이 활발해지는 해예요.",
  "劫財": "경쟁과 지출이 늘기 쉬운 해예요. 투자나 보증은 신중하게, 대신 추진력은 강해져요.",
  "食神": "재능을 발휘하고 여유를 즐기기 좋은 해예요. 먹거리·취미·창작 활동에 복이 있어요.",
  "傷官": "표현욕이 강해지고 변화를 원하게 되는 해예요. 창의력은 높아지지만 말실수에 주의하세요.",
  "偏財": "활동적으로 돈을 벌 수 있는 해예요. 새로운 사업이나 투자 기회가 올 수 있어요.",
  "正財": "안정적인 수입과 재물 관리에 유리한 해예요. 꾸준한 노력이 보상받는 시기예요.",
  "偏官": "변화와 도전이 찾아오는 해예요. 승진이나 새 역할이 생길 수 있지만 스트레스도 커요.",
  "正官": "직장·사회적 지위가 안정되는 해예요. 인정받기 좋지만 책임도 무거워져요.",
  "偏印": "영감과 직감이 강해지는 해예요. 공부·연구·자격증에 유리하지만 생각이 많아지고 외로워질 수 있어요.",
  "正印": "학문적 지원과 안정이 들어오는 해예요. 어머니나 윗사람의 도움을 받기 좋은 시기예요.",
};

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "태어난 해", "월주": "태어난 달", "일주": "태어난 날", "시주": "태어난 시간",
};

function buildSeunNarrative(stem: SipsinInfo, branch: SipsinInfo): string {
  const stemDesc = SIPSIN_YEAR_DESC[stem.sipsin_name] ?? "";
  if (stem.sipsin_name === branch.sipsin_name) {
    return stemDesc + " 하늘과 땅 모두 같은 기운이라 이 영향이 특히 강하게 나타나요.";
  }
  return `${stemDesc} 여기에 ${SIPSIN_YEAR_DESC[branch.sipsin_name] ?? ""}`;
}

function buildClashNarrative(clashes: ClashInfo[]): string {
  if (clashes.length === 0) return "";
  const areas = [...new Set(clashes.map((c) => PILLAR_LABEL_MAP[c.pillar] ?? c.pillar))];
  return `올해 기운이 내 사주의 ${areas.join(", ")} 자리와 부딪혀요. 갑작스러운 변화나 갈등이 생길 수 있으니 유연하게 대처하세요.`;
}

function buildCombineNarrative(combines: CombineInfo[]): string {
  if (combines.length === 0) return "";
  const areas = [...new Set(combines.map((c) => PILLAR_LABEL_MAP[c.pillar] ?? c.pillar))];
  return `올해 기운이 내 사주의 ${areas.join(", ")} 자리와 잘 어울려요. 좋은 인연이나 기회가 자연스럽게 찾아올 수 있어요.`;
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function AdviceTab({ natal, postnatal }: Props) {
  const yongInfo = getElementInfo(natal.yongshin_info.name);
  const allClashes = [...postnatal.seun_clashes, ...postnatal.daeun_clashes];
  const allCombines = [...postnatal.seun_combines, ...postnatal.daeun_combines];

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
            {postnatal.samjae_fortune.length > 0 && (
              <div className="slide-card__body pt-4">
                <InterpretSection title="" blocks={postnatal.samjae_fortune} variant="warning" />
              </div>
            )}
          </div>
        );
      })()}

      {/* 올해 기운 요약 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">{postnatal.year}년 기운 요약</h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
            용신 <strong>{yongInfo.korean}</strong>이 올해 운에 {postnatal.yongshin_in_seun ? "들어와 있어요 ✓" : "직접 오지 않았어요"}
          </p>
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {buildSeunNarrative(postnatal.seun_stem, postnatal.seun_branch)}
          </p>
          {allClashes.length > 0 && (
            <div className="rounded-lg px-4 py-3 text-sm leading-relaxed bg-[var(--color-ivory)]"
              style={{ borderLeft: "3px solid var(--color-fire)" }}>
              <span className="font-medium text-[var(--color-fire)]">주의할 점</span>
              <span className="text-[var(--color-ink-light)] ml-2">{buildClashNarrative(allClashes)}</span>
            </div>
          )}
          {allCombines.length > 0 && (
            <div className="rounded-lg px-4 py-3 text-sm leading-relaxed bg-[var(--color-ivory)]"
              style={{ borderLeft: "3px solid var(--color-wood)" }}>
              <span className="font-medium text-[var(--color-wood)]">좋은 신호</span>
              <span className="text-[var(--color-ink-light)] ml-2">{buildCombineNarrative(allCombines)}</span>
            </div>
          )}
          <DetailToggle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "하늘 기운", term: "천간", info: postnatal.seun_stem },
                { label: "땅 기운",   term: "지지",  info: postnatal.seun_branch },
              ].map(({ label, term, info }) => (
                <div key={term} className="rounded-lg p-4 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                  <div className="text-xs text-[var(--color-ink-faint)] mb-1">{label} <TermBadge term={term} /></div>
                  <div className="font-heading text-2xl font-bold text-[var(--color-ink)]">{info.char}</div>
                  <div className="text-xs text-[var(--color-ink-muted)] mt-1">{info.sipsin_name} — {info.domain}</div>
                </div>
              ))}
            </div>
          </DetailToggle>
        </div>
      </div>

      {/* 영역별 운세 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">영역별 운세</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <DomainBarChart scores={postnatal.domain_scores} />
          <div className="mt-5 pt-5 border-t border-[var(--color-border-light)]">
            <InterpretSection title="" blocks={postnatal.fortune_by_domain} />
          </div>
        </div>
      </div>

      {/* 종합 조언 및 개운법 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">종합 조언 및 개운법</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.advice} variant="success" />
        </div>
      </div>

      {/* 도움이 되는 기운 · 용신 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">도움이 되는 기운 · 용신</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <InterpretSection title="" blocks={postnatal.yongshin} />
        </div>
      </div>
    </div>
  );
}
