// 인증
export const MEMBER_ID_KEY = "kkachi_member_id";

// 시간 선택 옵션 (자시~해시 12시 + 모름)
export const HOUR_OPTIONS = [
  { value: "", label: "모르겠어요", time: "12:00" },
  { value: "23", label: "자시 (子) 23~01시", time: "00:00" },
  { value: "01", label: "축시 (丑) 01~03시", time: "02:00" },
  { value: "03", label: "인시 (寅) 03~05시", time: "04:00" },
  { value: "05", label: "묘시 (卯) 05~07시", time: "06:00" },
  { value: "07", label: "진시 (辰) 07~09시", time: "08:00" },
  { value: "09", label: "사시 (巳) 09~11시", time: "10:00" },
  { value: "11", label: "오시 (午) 11~13시", time: "12:00" },
  { value: "13", label: "미시 (未) 13~15시", time: "14:00" },
  { value: "15", label: "신시 (申) 15~17시", time: "16:00" },
  { value: "17", label: "유시 (酉) 17~19시", time: "18:00" },
  { value: "19", label: "술시 (戌) 19~21시", time: "20:00" },
  { value: "21", label: "해시 (亥) 21~23시", time: "22:00" },
];

// 시간(hour) → 시(時) 이름 변환 (구데이터 05:00, 신데이터 06:00 모두 "묘시"로 처리)
export function hourToSiLabel(hour: number): string {
  if (hour === 23 || hour === 0) return "자시 (23~01시)";
  if (hour <= 2) return "축시 (01~03시)";
  if (hour <= 4) return "인시 (03~05시)";
  if (hour <= 6) return "묘시 (05~07시)";
  if (hour <= 8) return "진시 (07~09시)";
  if (hour <= 10) return "사시 (09~11시)";
  if (hour <= 12) return "오시 (11~13시)";
  if (hour <= 14) return "미시 (13~15시)";
  if (hour <= 16) return "신시 (15~17시)";
  if (hour <= 18) return "유시 (17~19시)";
  if (hour <= 20) return "술시 (19~21시)";
  return "해시 (21~23시)";
}

// 입력 필드 공통 스타일
export const INPUT_CLASS =
  "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";
