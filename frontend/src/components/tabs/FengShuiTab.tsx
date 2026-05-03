import type { NatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import InterpretSection from "@/components/InterpretSection";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";

interface Props {
  natal: NatalResult;
  name?: string;
}

const TRIGRAM_DESC: Record<string, string> = {
  "坎": "팔괘의 물(水·坎). 흐르는 물처럼 어떤 형태에도 적응하며 깊은 지혜를 품어요.",
  "坤": "팔괘의 땅(地·坤). 대지가 만물을 기르듯 포용력과 인내가 가장 큰 힘이에요.",
  "震": "팔괘의 우레(雷·震). 천둥이 대지를 깨우듯 강한 추진력과 행동력이 특징이에요.",
  "巽": "팔괘의 바람(風·巽). 바람이 어디든 스며들듯 유연함과 침투력이 뛰어나요.",
  "乾": "팔괘의 하늘(天·乾). 하늘이 모든 것을 아우르듯 리더십과 강한 의지가 돋보여요.",
  "兌": "팔괘의 연못(澤·兌). 잔잔한 물이 빛을 담듯 기쁨과 소통으로 사람을 끌어당겨요.",
  "艮": "팔괘의 산(山·艮). 산처럼 묵직하고 변하지 않는 신뢰와 안정감이 강점이에요.",
  "離": "팔괘의 불(火·離). 불꽃이 사방을 밝히듯 열정과 존재감으로 주변을 이끌어요.",
};

const DIRECTION_EMOJI: Record<string, string> = {
  북: "⬆️", 남: "⬇️", 동: "➡️", 서: "⬅️",
  동북: "↗️", 동남: "↘️", 서남: "↙️", 서북: "↖️",
};

function parseKuaInfo(blocks: NatalResult["feng_shui"]) {
  const kuaBlock = blocks.find((b) => b.category === "쿠아 넘버");
  const luckyBlock = blocks.find((b) => b.category === "행운의 방위");
  const otherBlocks = blocks.filter(
    (b) => b.category !== "쿠아 넘버" && b.category !== "행운의 방위"
  );

  const desc = kuaBlock?.description ?? "";
  const trigramMatch = desc.match(/— (.+?) \//);
  const trigram = trigramMatch ? trigramMatch[1] : "";

  const ohaengTip = kuaBlock?.tips.find((t) => t.label === "오행");
  const groupTip = kuaBlock?.tips.find((t) => t.label === "그룹");
  const element = ohaengTip?.text?.[0] ?? "土";
  const group = groupTip?.text ?? "";

  return { trigram, element, group, luckyBlock, otherBlocks };
}

export default function FengShuiTab({ natal, name }: Props) {
  const blocks = natal.feng_shui ?? [];

  if (!blocks.length) {
    return (
      <div className="slide-card">
        <div className="slide-card__body">
          <p className="text-sm text-[var(--color-ink-muted)]">
            풍수지리 데이터를 불러올 수 없어요. 다시 분석해주세요.
          </p>
        </div>
      </div>
    );
  }

  const { trigram, element, group, luckyBlock, otherBlocks } = parseKuaInfo(blocks);
  const elInfo = getElementInfo(element);

  return (
    <div className="space-y-4">
      {/* 나의 풍수 + 행운의 방위 통합 카드 */}
      <div className="slide-card" style={{ borderColor: elInfo.borderColor }}>
        <CollapsibleSectionHeader title="나의 풍수">
          생년 기준으로 산출한 <strong className="text-[var(--color-ink)]">쿠아 넘버(九星)</strong>와 <strong className="text-[var(--color-ink)]">팔괘(八卦)</strong>로 본인에게 어울리는 방위·색상을 알려드려요. 동사택/서사택 그룹에 따라 길한 방위가 달라요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            나의 본명괘(本命卦)는 <strong>{trigram.split("(")[0]}</strong>이에요. {TRIGRAM_DESC[trigram.split("(")[0]] ?? ""}
          </KkachiTip>
          {/* 쿠아 타일 + 그룹 */}
          <div className="flex items-start gap-5">
            <div
              className="flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-0.5"
              style={{ backgroundColor: elInfo.bgColor, border: `1.5px solid ${elInfo.borderColor}` }}
            >
              <span className="font-heading text-4xl font-bold leading-none" style={{ color: elInfo.color }}>
                {trigram.split("(")[0]}
              </span>
              <span className="text-[11px] font-medium" style={{ color: elInfo.color }}>
                {elInfo.korean}({element})
              </span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <span className="font-heading text-2xl font-bold text-[var(--color-ink)]">
                {group}
              </span>
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">
                {group.includes("동사택")
                  ? "동·남·북·동남 방위가 길한 그룹"
                  : "서·서남·서북·동북 방위가 길한 그룹"}
              </p>
            </div>
          </div>

          {/* 행운의 방위 그리드 */}
          {luckyBlock && (
            <>
              <div className="divider" />
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">행운의 방위</p>
                <div className="grid grid-cols-2 gap-2">
                  {luckyBlock.tips.map((tip, i) => (
                    <div
                      key={tip.label}
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: i === 0 ? elInfo.bgColor : "var(--color-ivory)",
                        borderColor: i === 0 ? elInfo.borderColor : "var(--color-border-light)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{DIRECTION_EMOJI[tip.label] ?? "🧭"}</span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: i === 0 ? elInfo.color : "var(--color-ink)" }}
                        >
                          {tip.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--color-ink-faint)] leading-relaxed">
                        {tip.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <KkachiTip>
                {trigram} — {TRIGRAM_DESC[trigram.split("(")[0]] ?? ""}
              </KkachiTip>
            </>
          )}
        </div>
      </div>

      {/* 피해야 할 방위 + 인테리어 개운법 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="개운법(開運法)">
          공간을 활용한 풍수 개운 방법이에요. <strong className="text-[var(--color-ink)]">색상·소품·방위</strong>를 일상에 들이면 운의 결이 달라져요. 피해야 할 방위는 가능하면 침대·책상 머리에 두지 않는 것이 좋아요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            {name ? `${name}님, ` : ""}방위를 맞추기 어려울 땐 행운 색상 소품부터 시작해보세요. 작은 변화도 공간의 기운을 바꿀 수 있어요.
          </KkachiTip>
          <InterpretSection title="" blocks={otherBlocks} />
        </div>
      </div>
    </div>
  );
}
