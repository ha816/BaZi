/** 운수대통(運數大通) 직인 — 좋은 날 점수 위에 쾅 찍힌다(2026-10-23). 시운 화면·시운 공유 페이지 공용.
 *  그림은 public/kkachi/seal/unsu_daetong.png(투명 PNG, 인주 질감 — Noto Serif KR Black OFL 서브셋으로 그림).
 *  애니메이션은 globals.css .seal-stamp(크게 떠 있다가 내려와 눌리고 -12° 기운 채 멈춤) — 마운트될 때마다 다시 찍힌다(key로 다시 마운트) */
export const SEAL_SRC = "/kkachi/seal/unsu_daetong.png";

export default function LuckySeal({ className = "", size = 56 }: { className?: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SEAL_SRC}
      alt="운수대통(運數大通)"
      width={size}
      height={size}
      className={`seal-stamp pointer-events-none select-none drop-shadow-sm ${className}`}
      style={{ width: size, height: size, transform: "rotate(-12deg)" }}
    />
  );
}
