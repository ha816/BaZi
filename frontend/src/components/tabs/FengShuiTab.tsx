import type { NatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import InlineCollapsibleHeader from "@/components/InlineCollapsibleHeader";

interface Props {
  natal: NatalResult;
  name?: string;
}

const DIRECTION_EMOJI: Record<string, string> = {
  북: "⬆️", 남: "⬇️", 동: "➡️", 서: "⬅️",
  동북: "↗️", 동남: "↘️", 서남: "↙️", 서북: "↖️",
};

function hasJongseong(s: string): boolean {
  const last = s.charAt(s.length - 1);
  const code = last.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}

// 后天八卦 + 洛書(Lo Shu) — 3×3 매직스퀘어 배치
// 현대 지도식 배치 (上北下南·右東左西)
const KUA_GRID = [
  { kua: 6, char: "乾", reading: "건", direction: "서북" },
  { kua: 1, char: "坎", reading: "감", direction: "북" },
  { kua: 8, char: "艮", reading: "간", direction: "동북" },
  { kua: 7, char: "兌", reading: "태", direction: "서" },
  { kua: 5, char: "·", reading: "",   direction: "중앙" },
  { kua: 3, char: "震", reading: "진", direction: "동" },
  { kua: 2, char: "坤", reading: "곤", direction: "서남" },
  { kua: 9, char: "離", reading: "리", direction: "남" },
  { kua: 4, char: "巽", reading: "손", direction: "동남" },
];
const EAST_GROUP = [1, 3, 4, 9];

const EAST_BG = "#DCEBE0";
const EAST_BORDER = "#7AAE8C";
const EAST_INK = "#1B6B3A";
const WEST_BG = "#FBE9C2";
const WEST_BORDER = "#D4A85A";
const WEST_INK = "#8A6420";

function PalGwaeGrid({ kua }: { kua: number }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-1 max-w-[260px] mx-auto">
        {KUA_GRID.map((cell) => {
          const isUser = cell.kua === kua;
          const isCenter = cell.kua === 5;
          const isEast = EAST_GROUP.includes(cell.kua);
          const bg = isCenter ? "var(--color-border-light)" : isEast ? EAST_BG : WEST_BG;
          const border = isCenter ? "var(--color-border-light)" : isEast ? EAST_BORDER : WEST_BORDER;
          const ink = isCenter ? "var(--color-ink-faint)" : isEast ? EAST_INK : WEST_INK;
          return (
            <div
              key={cell.kua}
              className="relative aspect-square rounded-md flex flex-col items-center justify-center text-center"
              style={{
                backgroundColor: isUser ? "var(--color-gold-faint)" : bg,
                border: isUser ? "2px solid var(--color-gold)" : `1px solid ${border}`,
              }}
            >
              {isUser && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap"
                  style={{ backgroundColor: "var(--color-gold)", color: "white" }}
                >
                  본명괘
                </span>
              )}
              <span className="text-[10px] text-[var(--color-ink-muted)] leading-none">{cell.direction}</span>
              <span className="font-heading text-sm font-bold leading-none mt-1" style={{ color: ink }}>
                {cell.reading ? `${cell.reading}(${cell.char})` : cell.char}
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-ink-faint)] mt-1">{cell.kua}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-3 mt-2 text-[10px]">
        <span className="flex items-center gap-1" style={{ color: EAST_INK }}>
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: EAST_BG, border: `1px solid ${EAST_BORDER}` }} />
          <strong>동사택(東四宅)</strong>
        </span>
        <span className="flex items-center gap-1" style={{ color: WEST_INK }}>
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: WEST_BG, border: `1px solid ${WEST_BORDER}` }} />
          <strong>서사택(西四宅)</strong>
        </span>
      </div>
    </div>
  );
}

export default function FengShuiTab({ natal, name }: Props) {
  const fs = natal.feng_shui;

  if (!fs) {
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

  const elInfo = getElementInfo(fs.trigram.element);

  return (
    <div className="space-y-4">
      {/* 나의 풍수 + 행운의 방위 통합 카드 */}
      <div className="slide-card" style={{ borderColor: elInfo.borderColor }}>
        <CollapsibleSectionHeader title="풍수(風水)">
          <p>
            <strong className="text-[var(--color-ink)]">풍수(風水)</strong>는 공간의 기운을 다루는 학문으로, 같은 집에 살아도 사람마다 잘 맞는 방위·색상이 달라요. 그 중 <strong className="text-[var(--color-ink)]">팔택풍수(八宅風水)</strong>는 생년·성별로 1~9 사이의 <strong className="text-[var(--color-ink)]">쿠아 넘버(九星)</strong>를 뽑고, 이 숫자가 8괘(八卦) 중 하나에 대응되는데 이를 본인의 <strong className="text-[var(--color-ink)]">본명괘(本命卦)</strong>라 해요. 본명괘에 따라 <strong style={{ color: EAST_INK }}>동사택(東四宅)</strong> 또는 <strong style={{ color: WEST_INK }}>서사택(西四宅)</strong> 두 그룹 중 하나에 속하고, 그룹별로 길한 방위가 달라져요.
          </p>
          <p>
            ※ 전통 풍수 도식은 위가 남(南), 왼쪽이 동(東)으로 그려요. 옛날에 황제·관찰자가 항상 남쪽을 바라보는 자세(面南)를 기준으로 해서, 앞쪽인 남이 그림 위, 왼손 쪽인 동이 왼쪽이었어요.
          </p>
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            공간의 기운을 다루는 풍수(風水)는 사람마다 어울리는 방위가 달라요. 알아보아요.
          </KkachiTip>
          <PalGwaeGrid kua={fs.kua_number} />
          <KkachiTip>
            {name ? `${name}님` : "나"}의 본명괘(本命卦)는 {fs.trigram.char}({fs.trigram.reading}){hasJongseong(fs.trigram.reading) ? "으로" : "로"} {fs.group}에 속해요. {fs.trigram.char}({fs.trigram.reading})의 오행은 {fs.trigram.element_korean}({fs.trigram.element}){hasJongseong(fs.trigram.element_korean) ? "이에요" : "예요"}. {fs.trigram.description}
          </KkachiTip>

          {/* 행운의 방위(吉方) */}
          <div className="divider" />
          <InlineCollapsibleHeader title="행운의 방위(吉方)">
            본명괘를 기준으로 <strong className="text-[var(--color-ink)]">4개의 길한 방위</strong>가 산출돼요. 같은 그룹(<strong style={{ color: EAST_INK }}>동사택</strong>·<strong style={{ color: WEST_INK }}>서사택</strong>)은 4방위를 공유하지만, 각 방위가 어떤 종류의 길방(<strong className="text-[var(--color-ink)]">생기·연년·천의·복위</strong>)으로 작용할지는 본인 쿠아 넘버에 따라 달라져요. <strong className="text-[var(--color-ink)]">생기(生氣)</strong>는 최고 길방(재물·성취), <strong className="text-[var(--color-ink)]">연년(延年)</strong>은 건강·장수·인연, <strong className="text-[var(--color-ink)]">천의(天醫)</strong>는 귀인·치유·회복, <strong className="text-[var(--color-ink)]">복위(伏位)</strong>는 안정·꾸준한 발전을 뜻해요. 본명괘 자체의 방위는 항상 복위가 돼요.
          </InlineCollapsibleHeader>
          <div className="divider" />
          <KkachiTip>
            본인이 속한 동사택·서사택 그룹의 4방위가 곧 길한 방위가 되고, 본인 쿠아 넘버가 4방위 각각의 길방 종류(생기·연년·천의·복위)를 정해요.
          </KkachiTip>
          <div className="grid grid-cols-4 gap-2">
            {fs.lucky_directions.map((d, i) => (
              <div
                key={d.direction}
                className="rounded-lg p-2 border flex flex-col items-center text-center gap-0.5"
                style={{
                  backgroundColor: i === 0 ? elInfo.bgColor : "var(--color-ivory)",
                  borderColor: i === 0 ? elInfo.borderColor : "var(--color-border-light)",
                }}
              >
                <span className="text-base">{DIRECTION_EMOJI[d.direction] ?? "🧭"}</span>
                <span
                  className="text-sm font-bold leading-none"
                  style={{ color: i === 0 ? elInfo.color : "var(--color-ink)" }}
                >
                  {d.direction}
                </span>
                <span
                  className="text-[10px] font-semibold leading-tight mt-0.5"
                  style={{ color: i === 0 ? elInfo.color : "var(--color-ink-muted)" }}
                >
                  {d.kind_korean}
                  <span className="block text-[8px] opacity-70">({d.kind_han})</span>
                </span>
                <p className="text-[9px] text-[var(--color-ink-faint)] leading-tight mt-1">
                  {d.meaning}
                </p>
              </div>
            ))}
          </div>
          <KkachiTip>
            본명괘(本命卦) {fs.trigram.char}({fs.trigram.reading}) 기준 4개의 길한 방위예요. 1순위 생기(生氣)부터 활용해보세요. 책상·침대 머리를 길방을 향하게 두면 그 종류의 운이 돕는다고 해요.
          </KkachiTip>
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

          {/* 피해야 할 방위 */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">피해야 할 방위</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {fs.unlucky_directions.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs"
                  style={{ borderColor: "var(--color-border-light)", color: "var(--color-ink-muted)" }}
                >
                  <span>{DIRECTION_EMOJI[d] ?? "🧭"}</span>
                  <span>{d}</span>
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed">{fs.avoid_advice}</p>
          </div>

          {/* 인테리어 개운법 */}
          {fs.interior_tips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">인테리어 개운법</p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mb-2 leading-relaxed">{fs.interior_intro}</p>
              <div className="space-y-1.5">
                {fs.interior_tips.map((tip) => (
                  <div key={tip.label} className="rounded-lg p-2.5 border" style={{ borderColor: "var(--color-border-light)" }}>
                    <p className="text-xs font-semibold text-[var(--color-ink)]">{tip.label}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed mt-0.5">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
