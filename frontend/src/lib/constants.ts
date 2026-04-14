// 인증
export const MEMBER_ID_KEY = "kkachi_member_id";

// 시간 선택 옵션 (자시~해시 12시 + 모름)
export const HOUR_OPTIONS = [
  { value: "", label: "모르겠어요", time: "12:00" },
  { value: "23", label: "자시 (子) 23~01시", time: "23:00" },
  { value: "01", label: "축시 (丑) 01~03시", time: "01:00" },
  { value: "03", label: "인시 (寅) 03~05시", time: "03:00" },
  { value: "05", label: "묘시 (卯) 05~07시", time: "05:00" },
  { value: "07", label: "진시 (辰) 07~09시", time: "07:00" },
  { value: "09", label: "사시 (巳) 09~11시", time: "09:00" },
  { value: "11", label: "오시 (午) 11~13시", time: "11:00" },
  { value: "13", label: "미시 (未) 13~15시", time: "13:00" },
  { value: "15", label: "신시 (申) 15~17시", time: "15:00" },
  { value: "17", label: "유시 (酉) 17~19시", time: "17:00" },
  { value: "19", label: "술시 (戌) 19~21시", time: "19:00" },
  { value: "21", label: "해시 (亥) 21~23시", time: "21:00" },
];

// 입력 필드 공통 스타일
export const INPUT_CLASS =
  "w-full border border-[var(--color-border)] rounded-lg px-4 py-3 text-base bg-[var(--color-card)] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors";
