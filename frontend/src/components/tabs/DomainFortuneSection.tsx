"use client";

import type { PostnatalResult } from "@/types/analysis";
import DomainBarChart from "@/components/DomainBarChart";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";

// 삶의 영역별 운(運) — 올해(세운)+대운 십신 기준 5영역 점수. 시운 탭에서 분리해 택시 탭에 붙인다.
export default function DomainFortuneSection({ postnatal }: { postnatal: PostnatalResult }) {
  if (Object.keys(postnatal.domain_scores).length === 0) return null;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="삶의 영역별 운(運)">
        <strong className="text-[var(--color-ink)]">재성(財·재물운)·관성(官·관록운)·인성(印·학문운)·식상(食傷·재능운)·비겁(比劫·인연운)</strong> — 사주까치는 이 다섯 가지로 삶의 영역을 정의해요. 대운(10년)·세운(올해) 십신 분포로 점수를 매기고, 월운(이번달) 십신을 뱃지로 함께 표시해요.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          어떤 영역에서 운이 잘 풀리고 조심해야 할지 한눈에 봐요.
        </KkachiTip>
        <DomainBarChart scores={postnatal.domain_scores} monthBadges={postnatal.month_badges} />
        {(() => {
          const sorted = Object.entries(postnatal.domain_scores).sort(([, a], [, b]) => b.score - a.score);
          if (sorted.length === 0) return null;
          const [bestName, bestInfo] = sorted[0];
          const [worstName, worstInfo] = sorted[sorted.length - 1];
          const blockByCategory = Object.fromEntries(postnatal.fortune_by_domain.map((b) => [b.category, b]));
          const bestBlock = blockByCategory[bestName];
          const bestTip = bestBlock?.tips?.[0]?.text;
          return (
            <KkachiTip>
              올해 가장 좋은 영역은 <strong>{bestName}</strong>({bestInfo.score}%)이에요.
              {bestBlock?.description && <> {bestBlock.description}</>}
              {bestTip && <> {bestTip}</>}
              {bestName !== worstName && (
                <> 반대로 <strong>{worstName}</strong>({worstInfo.score}%)은 잠잠한 시기니 큰 변화보다 내실을 다지세요.</>
              )}
            </KkachiTip>
          );
        })()}
      </div>
    </div>
  );
}
