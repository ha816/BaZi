import { forwardRef } from "react";
import type { BasicResult } from "@/types/analysis";

const PILLAR_LABELS = ["년주", "월주", "일주", "시주"];

// 오행별 카드 테마
const ELEMENT_THEME: Record<string, { bg: string; accent: string; text: string; sub: string }> = {
  木: { bg: "linear-gradient(145deg, #dff0df 0%, #b8dbb8 100%)", accent: "#2d7a47", text: "#1a4a2e", sub: "#4a9460" },
  火: { bg: "linear-gradient(145deg, #fde8e4 0%, #f5bfb0 100%)", accent: "#c0392b", text: "#7b1f17", sub: "#d95f4b" },
  土: { bg: "linear-gradient(145deg, #fef3cd 0%, #f5dfa0 100%)", accent: "#9a6f00", text: "#5c3d00", sub: "#c49a00" },
  金: { bg: "linear-gradient(145deg, #ebebeb 0%, #d0d0d0 100%)", accent: "#555555", text: "#222222", sub: "#888888" },
  水: { bg: "linear-gradient(145deg, #dbeafe 0%, #bfdbfe 100%)", accent: "#1e40af", text: "#1e3a8a", sub: "#3b6fd4" },
};

const DEFAULT_THEME = ELEMENT_THEME["火"];

interface Props {
  data: BasicResult;
  name: string;
}

const ShareCard = forwardRef<HTMLDivElement, Props>(({ data, name }, ref) => {
  const theme = ELEMENT_THEME[data.my_element.name] ?? DEFAULT_THEME;

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        height: 360,
        background: theme.bg,
        fontFamily: "'Noto Serif KR', 'serif'",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "28px 24px 20px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 장식 원 */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: theme.accent, opacity: 0.08,
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: theme.accent, opacity: 0.06,
      }} />

      {/* 헤더: 브랜드 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
        <img src="/kkachi/normal_kkachi_00.png" alt="까치" style={{ width: 28, height: 28, objectFit: "contain" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent, letterSpacing: "0.05em" }}>사주까치</span>
      </div>

      {/* 이름 */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 4, letterSpacing: "0.08em" }}>
          {name ? `${name}의 사주팔자` : "나의 사주팔자"}
        </p>

        {/* 4기둥 */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "12px 0" }}>
          {data.pillars.map((pillar, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: theme.text, lineHeight: 1 }}>
                {pillar[0]}
              </span>
              <span style={{ fontSize: 28, fontWeight: 500, color: theme.accent, lineHeight: 1 }}>
                {pillar[1]}
              </span>
              <span style={{ fontSize: 10, color: theme.sub, marginTop: 2 }}>
                {PILLAR_LABELS[i]}
              </span>
            </div>
          ))}
        </div>

        {/* 오행 뱃지 */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: theme.accent, borderRadius: 20, padding: "5px 14px", marginTop: 4,
        }}>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
            {data.my_element.meaning}({data.my_element.name}) 일간
          </span>
        </div>
      </div>

      {/* 푸터 */}
      <p style={{ fontSize: 11, color: theme.sub, letterSpacing: "0.05em" }}>
        까치가 오늘의 기운을 가장 먼저 전해드립니다 🪶
      </p>
    </div>
  );
});

ShareCard.displayName = "ShareCard";

export default ShareCard;
