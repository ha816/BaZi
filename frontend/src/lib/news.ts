/** 까치 신문 새소식 — 운영자가 맨 위에 한 줄 더한다(맨 위가 최신). /news 새소식 카드는 전부(최신 1 + 지난 소식), 홈 까치 신문 카드는 7일 안 것만 머리기사로 (2026-11-08, specs/news) */
export type KkachiNews = { date: string; emoji: string; title: string; body: string; href?: string };

export const KKACHI_NEWS: KkachiNews[] = [
  { date: "2026-11-08", emoji: "📰", title: "까치 신문을 펼쳤어요", body: "새소식·사주 한 입·절기·손없는 날을 한 면에 모았어요. 홈은 오늘의 나와 내 사람들만 남겨 가벼워졌어요.", href: "/news" },
  { date: "2026-11-05", emoji: "🃏", title: "오늘의 타로카드가 생겼어요", body: "까치가 매일 아침 타로 카드 한 장을 뽑아 둬요. 홈에서 뒤집어 보세요.", href: "/tarot" },
  { date: "2026-10-25", emoji: "🪪", title: "사주 분석도 궁합처럼 골라서", body: "저장한 프로필을 카드에서 바로 고르거나, 직접 입력해 저장 없이 바로 볼 수 있어요.", href: "/analysis" },
  { date: "2026-10-18", emoji: "💞", title: "궁합에 시운 탭이 생겼어요", body: "두 분의 오늘·내일·모레 궁합과 2주 안에 함께하기 좋은 날을 알려 드려요.", href: "/compatibility" },
];

/** 날짜 문자열(YYYY-MM-DD)의 일 순번 — 새소식 "N일 안"·사주 한 입 순번 */
export const dayNoOf = (iso: string) => Math.floor(Date.parse(iso) / 86_400_000);
