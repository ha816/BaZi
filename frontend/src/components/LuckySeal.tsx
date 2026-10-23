/** 운수대통(運數大通) 직인 — 좋은 날 점수 위에 쾅 찍힌다(2026-10-23). 시운 화면·시운 공유 페이지 공용(OG는 sealPose만 같이 쓴다).
 *  그림은 public/kkachi/seal/unsu_daetong.png(투명 PNG, 인주 질감 — Noto Serif KR Black OFL 서브셋으로 그림).
 *  애니메이션은 globals.css .seal-stamp — 마운트될 때마다 다시 찍힌다(key로 다시 마운트).
 *  손으로 찍은 듯 기울기·위치가 날마다 조금씩 다르다(seed = 날짜). 같은 날짜면 시운 화면·공유 페이지·OG가 같은 모양 —
 *  완전 무작위는 서버·브라우저 렌더가 달라 하이드레이션 경고가 나고 카드 이미지와 페이지가 어긋난다 */
export const SEAL_SRC = "/kkachi/seal/unsu_daetong.png";

/** seed(날짜 등) → 기울기 -20°~-4°, 위치 dx·dy -1~1(크기에 곱해 쓴다) */
export function sealPose(seed: string): { rotate: number; dx: number; dy: number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  // 비슷한 날짜(끝 글자만 다름)도 고르게 흩어지게 한 번 더 섞는다(murmur3 fmix32)
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  const r = (n: number) => (((h >>> (n * 8)) & 0xff) / 255) * 2 - 1; // -1 ~ 1
  return { rotate: Math.round(-12 + r(0) * 8), dx: r(1), dy: r(2) };
}

export default function LuckySeal({ className = "", size = 56, seed = "", src = SEAL_SRC, alt = "운수대통(運數大通)" }: { className?: string; size?: number; seed?: string; src?: string; alt?: string }) {
  const { rotate, dx, dy } = sealPose(seed);
  const jitter = size * 0.14; // 56px 기준 ±8px
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`seal-stamp pointer-events-none select-none drop-shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        translate: `${Math.round(dx * jitter)}px ${Math.round(dy * jitter)}px`,
        transform: `rotate(${rotate}deg)`,
        ["--seal-rot" as string]: `${rotate}deg`,
      }}
    />
  );
}
