import type { NatalResult, LuckyDirection, UnluckyDirection, TrigramInfo } from "@/types/analysis";
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

// 초록 계열 — 진할수록 강한 길방
const LUCKY_KIND_COLOR: Record<string, { bg: string; border: string; ink: string }> = {
  생기: { bg: "#DCFCE7", border: "#16A34A", ink: "#14532D" },
  연년: { bg: "#F0FDF4", border: "#4ADE80", ink: "#166534" },
  천의: { bg: "#F0FDF4", border: "#86EFAC", ink: "#166534" },
  복위: { bg: "#F7FEF9", border: "#BBF7D0", ink: "#166534" },
};

// 붉은 계열 — 진할수록 강한 흉방
const UNLUCKY_COLOR: Record<string, { bg: string; border: string; ink: string }> = {
  절명: { bg: "#FEE2E2", border: "#DC2626", ink: "#7F1D1D" },
  오귀: { bg: "#FEE2E2", border: "#F87171", ink: "#991B1B" },
  육살: { bg: "#FEF2F2", border: "#FCA5A5", ink: "#991B1B" },
  화해: { bg: "#FFF5F5", border: "#FECACA", ink: "#B91C1C" },
};

// 후천팔괘 + 낙서(洛書) — 현대 지도식 배치 (위=북, 오른쪽=동)
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

// 3×3 컴패스 — 중앙은 본명괘
const COMPASS_LAYOUT: (string | null)[][] = [
  ["서북", "북", "동북"],
  ["서",   null,  "동"],
  ["서남", "남", "동남"],
];

type DirInfo =
  | { isLucky: true; kind_korean: string; kind_han: string; meaning: string; usage: string }
  | { isLucky: false; kind_korean: string; kind_han: string; meaning: string };

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
                backgroundColor: bg,
                border: isUser ? `2px solid ${border}` : `1px solid ${border}`,
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

function DirectionCompass({
  lucky_directions,
  unlucky_directions,
  trigram,
  kua,
}: {
  lucky_directions: LuckyDirection[];
  unlucky_directions: UnluckyDirection[];
  trigram: TrigramInfo;
  kua: number;
}) {
  const dirMap: Record<string, DirInfo> = {};
  for (const d of lucky_directions) {
    dirMap[d.direction] = { isLucky: true, kind_korean: d.kind_korean, kind_han: d.kind_han, meaning: d.meaning, usage: d.usage };
  }
  for (const d of unlucky_directions) {
    dirMap[d.direction] = { isLucky: false, kind_korean: d.kind_korean, kind_han: d.kind_han, meaning: d.meaning };
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {COMPASS_LAYOUT.flat().map((dir) => {
        if (dir === null) {
          return (
            <div
              key="center"
              className="rounded-lg flex flex-col items-center justify-center text-center p-2 border"
              style={{ backgroundColor: "transparent", borderColor: "var(--color-border-light)" }}
            >
              <span className="text-[8px] font-bold" style={{ color: "var(--color-gold)" }}>본명괘</span>
              <span className="font-heading text-xl font-bold leading-none mt-0.5" style={{ color: "var(--color-ink)" }}>
                {trigram.char}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-ink-muted)" }}>
                {trigram.reading} · {kua}번
              </span>
            </div>
          );
        }

        const info = dirMap[dir];
        if (!info) return <div key={dir} />;

        const col = info.isLucky
          ? (LUCKY_KIND_COLOR[info.kind_korean] ?? LUCKY_KIND_COLOR["복위"])
          : (UNLUCKY_COLOR[info.kind_korean] ?? UNLUCKY_COLOR["화해"]);

        const kindEmoji = info.kind_korean === "생기" ? "✨" : info.kind_korean === "절명" ? "⚠️" : null;

        return (
          <div
            key={dir}
            className="rounded-lg p-2 border flex flex-col items-center text-center gap-0.5"
            style={{ backgroundColor: col.bg, borderColor: col.border }}
          >
            <span className="text-sm leading-none">{DIRECTION_EMOJI[dir] ?? "🧭"}</span>
            <span className="text-xs font-bold leading-none mt-0.5" style={{ color: col.ink }}>
              {dir}{kindEmoji && <span className="ml-0.5">{kindEmoji}</span>}
            </span>
            <p className="text-[9px] font-semibold leading-tight mt-0.5" style={{ color: col.ink }}>
              {info.kind_korean} ({info.kind_han}) — {info.meaning.split("—")[0].split(",")[0].trim()}
            </p>
            {info.isLucky && (
              <p className="text-[7px] leading-tight mt-0.5 opacity-65" style={{ color: col.ink }}>
                {info.usage}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UnluckyCard({ d }: { d: UnluckyDirection }) {
  const col = UNLUCKY_COLOR[d.kind_korean] ?? UNLUCKY_COLOR["화해"];
  return (
    <div
      className="rounded-lg p-2.5 border flex flex-col items-center text-center gap-1"
      style={{ backgroundColor: col.bg, borderColor: col.border }}
    >
      <span className="text-base">{DIRECTION_EMOJI[d.direction] ?? "🧭"}</span>
      <span className="text-sm font-bold leading-none" style={{ color: col.ink }}>{d.direction}</span>
      <span className="text-[10px] font-semibold leading-tight" style={{ color: col.ink }}>
        {d.kind_korean}
        <span className="block text-[8px] opacity-70">({d.kind_han})</span>
      </span>
      <p className="text-[9px] leading-tight" style={{ color: col.ink, opacity: 0.8 }}>
        {d.meaning.split("—")[0].trim()}
      </p>
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
  const nameLabel = name ? `${name}님` : "나";

  return (
    <div className="space-y-4">
      {/* 카드 1 — 팔택풍수 + 길방·흉방 */}
      <div className="slide-card" style={{ borderColor: elInfo.borderColor }}>
        <CollapsibleSectionHeader title="풍수(風水)">
          <p>
            <strong className="text-[var(--color-ink)]">팔택풍수(八宅風水)</strong>는 생년·성별로
            1~9 사이의 <strong className="text-[var(--color-ink)]">쿠아 넘버(九星)</strong>를 뽑고,
            이 숫자가 8괘(八卦) 중 하나인 <strong className="text-[var(--color-ink)]">본명괘(本命卦)</strong>에 대응돼요.
            본명괘에 따라 <strong style={{ color: EAST_INK }}>동사택(東四宅)</strong> 또는{" "}
            <strong style={{ color: WEST_INK }}>서사택(西四宅)</strong> 중 하나에 속하며,
            그룹별로 길한 방위 4개와 흉한 방위 4개가 정해져요.
          </p>
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            {nameLabel}의 본명괘(本命卦)는 {fs.trigram.char}({fs.trigram.reading}){hasJongseong(fs.trigram.reading) ? "으로" : "로"}{" "}
            {fs.group}에 속해요. 쿠아 넘버는 <strong>{fs.kua_number}번</strong>이에요.
          </KkachiTip>
          <PalGwaeGrid kua={fs.kua_number} />

          {/* 8방위 길흉 배치 */}
          <div className="divider" />
          <InlineCollapsibleHeader title="8방위 길흉(吉凶) 배치">
            본명괘를 기준으로 8방위 각각의 길흉을 한눈에 표시해요.
          </InlineCollapsibleHeader>
          <div className="divider" />
          <KkachiTip>
            초록색은 좋은 방위, 붉은색은 나쁜 방위예요. 색이 진할수록 기운이 강해요.
            초록 중 가장 진한 <strong>생기(生氣)</strong>가 최고 길방이고,
            붉은 중 가장 진한 <strong>절명(絶命)</strong>이 가장 강한 흉방이에요.
          </KkachiTip>
          <DirectionCompass
            lucky_directions={fs.lucky_directions}
            unlucky_directions={fs.unlucky_directions}
            trigram={fs.trigram}
            kua={fs.kua_number}
          />

          <KkachiTip>{fs.avoid_advice}</KkachiTip>
          {(() => {
            const colorTip = fs.interior_tips.find(t => t.label === "행운 색상 활용");
            return (
              <KkachiTip>
                {colorTip && <>{colorTip.text} </>}
                거창한 인테리어가 아니어도 돼요.
                책상 방향 하나, 베개 위치 하나부터 바꿔보세요.
                작은 변화가 쌓이면 기운의 흐름이 달라져요.
              </KkachiTip>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
