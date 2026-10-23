/**
 * 사주 캐릭터 그림 경로 — 백엔드가 성별로 정한 그림 키(art_key: 남성 "갑_강", 여성 "갑_강_여", 2026-10-23)를 쓰고,
 * 옛 결과·옛 공유 카드처럼 art_key가 없으면 유형 키(key) 그림. 여성판 파일이 없으면 onError에서 유형 키 그림으로 한 번 떨어진다.
 */
export const CHAR_ART_DIR = "/kkachi/saju_character";

export function charArtSrc(artKey?: string | null, key?: string | null): string {
  return `${CHAR_ART_DIR}/${artKey || key}.webp`;
}

/** 그림 로드 실패 시 다음 후보 — 여성판(art_key)이 없으면 유형 키 그림, 그것도 없으면 last */
export function nextCharArtSrc(current: string, key: string | null | undefined, last: string): string {
  const base = key ? `${CHAR_ART_DIR}/${key}.webp` : null;
  return base && current !== base ? base : last;
}

/** <img onError>용 — 유형 키 그림으로 한 번, 그다음 last로 */
export function onCharArtError(key: string | null | undefined, last: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (key && el.dataset.artStep !== "base") {
      el.dataset.artStep = "base";
      el.src = `${CHAR_ART_DIR}/${key}.webp`;
    } else if (el.dataset.artStep !== "last") {
      el.dataset.artStep = "last";
      el.src = last;
    }
  };
}
