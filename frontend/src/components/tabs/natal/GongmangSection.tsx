"use client";

import type { NatalResult } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import { PILLAR_LABELS_SHORT } from "./data";

interface Props {
  natal: NatalResult;
}

export default function GongmangSection({ natal }: Props) {
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="공망(空亡)">
        60갑자(六十甲子) 순(旬)에서 짝이 없는 지지를 말해요. 해당 기둥의 기운이 비어 있어 약해지지만, <strong className="text-[var(--color-ink)]">집착을 내려놓을수록 오히려 잘 풀리는 기운</strong>으로 풀이합니다.
        현대 명리에서는 공망이 있는 영역에서는 무리한 욕심보다 <strong className="text-[var(--color-ink)]">담담한 태도</strong>가 좋은 결과를 만듭니다.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>
          60갑자에서 짝이 없는 지지가 <strong className="text-[var(--color-ink)]">공망(空亡)</strong>이에요. 그 영역의 기운이 비어 있어 약해 보이지만, <strong className="text-[var(--color-ink)]">집착을 내려놓을수록 잘 풀리는</strong> 자리입니다.
        </KkachiTip>
        <div className="grid grid-cols-4 gap-2">
          {[3, 2, 1, 0].map((origI) => {
            const isGongmang = natal.gongmang[origI];
            return (
              <div key={origI} className="rounded-xl border text-center px-2 py-3"
                style={isGongmang
                  ? { borderColor: "var(--color-ink-faint)", backgroundColor: "var(--color-ivory-warm)" }
                  : { borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)", opacity: 0.4 }
                }
              >
                <div className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{PILLAR_LABELS_SHORT[origI]}</div>
                <div className="text-sm font-bold mt-1" style={{ color: isGongmang ? "var(--color-ink)" : "var(--color-ink-faint)" }}>
                  {isGongmang ? "空亡" : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
