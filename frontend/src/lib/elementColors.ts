export interface ElementInfo {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  korean: string;
  meaning: string;
}

const elementMap: Record<string, ElementInfo> = {
  "木": {
    color: "#1B6B3A",
    bgColor: "#C8E6D4",
    borderColor: "#6DB890",
    label: "木",
    korean: "나무",
    meaning: "성장과 시작",
  },
  "火": {
    color: "#B02020",
    bgColor: "#F8CCC8",
    borderColor: "#E07070",
    label: "火",
    korean: "불",
    meaning: "열정과 밝음",
  },
  "土": {
    color: "#8A4F00",
    bgColor: "#F5DCAA",
    borderColor: "#D4A060",
    label: "土",
    korean: "흙",
    meaning: "안정과 신뢰",
  },
  "金": {
    color: "#3D3D3D",
    bgColor: "#E0E0E0",
    borderColor: "#A0A0A0",
    label: "金",
    korean: "쇠",
    meaning: "결단과 의리",
  },
  "水": {
    color: "#0F4F8A",
    bgColor: "#C4DDF5",
    borderColor: "#6AAAD8",
    label: "水",
    korean: "물",
    meaning: "지혜와 유연",
  },
};

export default elementMap;

export function getElementInfo(name: string): ElementInfo {
  return (
    elementMap[name] ?? {
      color: "#78716C",
      bgColor: "#F0EDE5",
      borderColor: "#D4C4B0",
      label: name,
      korean: name,
      meaning: "",
    }
  );
}

export function getElementColor(name: string): string {
  return elementMap[name]?.color ?? "#78716C";
}

import { STEM_ELEMENT, BRANCH_ELEMENT } from "./ganji";

export function ganjiToElements(ganji: string): { stem: string; branch: string } {
  return {
    stem: STEM_ELEMENT[ganji[0]] ?? "",
    branch: BRANCH_ELEMENT[ganji[1]] ?? "",
  };
}

export const ELEMENT_META: Record<string, {
  emoji: string; label: string; meaning: string; bg: string; color: string;
}> = {
  "火": { emoji: "☀️", label: "화(火)", meaning: "활발한 기운이 가득한 날이에요",   bg: "bg-gradient-to-br from-orange-50 to-red-50",    color: "text-red-500" },
  "水": { emoji: "🌧️", label: "수(水)", meaning: "내면을 돌아보기 좋은 날이에요",   bg: "bg-gradient-to-br from-blue-50 to-sky-50",     color: "text-blue-500" },
  "木": { emoji: "💨", label: "목(木)", meaning: "새로운 시작과 성장의 기운이에요", bg: "bg-gradient-to-br from-green-50 to-emerald-50", color: "text-emerald-600" },
  "金": { emoji: "☁️", label: "금(金)", meaning: "정리하고 결단하기 좋은 날이에요", bg: "bg-gradient-to-br from-slate-50 to-gray-100",   color: "text-slate-500" },
  "土": { emoji: "⛅", label: "토(土)", meaning: "안정과 균형을 찾는 날이에요",     bg: "bg-gradient-to-br from-amber-50 to-yellow-50", color: "text-amber-600" },
};

export const FORECAST_LEVEL_META: Record<string, {
  color: string; badge: string; icon: string;
}> = {
  "좋은 날":          { color: "text-emerald-700 bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-800", icon: "🌟" },
  "평범한 날":        { color: "text-amber-700 bg-amber-50 border-amber-200",       badge: "bg-amber-100 text-amber-800",    icon: "☁️" },
  "주의가 필요한 날": { color: "text-rose-700 bg-rose-50 border-rose-200",           badge: "bg-rose-100 text-rose-800",      icon: "⚠️" },
};
