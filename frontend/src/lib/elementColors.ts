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
    color: "#5B8C6A",
    bgColor: "#EEF4F0",
    borderColor: "#C1D6C8",
    label: "木",
    korean: "나무",
    meaning: "성장과 시작",
  },
  "火": {
    color: "#C75B52",
    bgColor: "#F7EDEC",
    borderColor: "#E0B5B1",
    label: "火",
    korean: "불",
    meaning: "열정과 밝음",
  },
  "土": {
    color: "#B8945A",
    bgColor: "#F5F0E7",
    borderColor: "#DDD0B8",
    label: "土",
    korean: "흙",
    meaning: "안정과 신뢰",
  },
  "金": {
    color: "#7E7E8A",
    bgColor: "#F0F0F2",
    borderColor: "#C8C8CE",
    label: "金",
    korean: "쇠",
    meaning: "결단과 의리",
  },
  "水": {
    color: "#4A7BA5",
    bgColor: "#ECF1F6",
    borderColor: "#B3CAD9",
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

/* ── 천간/지지 → 오행 변환 ── */
const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const BRANCH_ELEMENT: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

export function ganjiToElements(ganji: string): { stem: string; branch: string } {
  return {
    stem: STEM_ELEMENT[ganji[0]] ?? "",
    branch: BRANCH_ELEMENT[ganji[1]] ?? "",
  };
}
