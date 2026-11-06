"use client";

import type { IchingLine } from "@/lib/api";

interface Props {
  /** 효 여섯 줄 아래→위 */
  lines: IchingLine[];
  /** 아래부터 몇 줄까지 보일지(동전 연출 중 쌓이는 모양 — 안 보인 줄은 자리를 차지하지 않아 더미가 자란다). 기본 전부 */
  shown?: number;
  size?: "sm" | "lg";
  /** 새로 보이는 줄에 hex-line-drop 애니 */
  animate?: boolean;
  className?: string;
}

/**
 * 괘 그림 — 선 여섯 줄(아래→위). 양은 한 줄, 음은 두 토막. 변효(움직이는 줄)는 금색이고 오른쪽에 ○(노양)·×(노음).
 * 그림 자산·폰트 글자 없이 CSS만(유니코드 ䷀는 화면 폰트 서브셋에 없다). /iching 본괘·지괘 공용 (주역 V11-1, 2026-11-07)
 */
export default function HexagramFigure({ lines, shown = 6, size = "lg", animate = false, className = "" }: Props) {
  const w = size === "lg" ? "w-28" : "w-14";
  const h = size === "lg" ? "h-2.5" : "h-1.5";
  const gap = size === "lg" ? "gap-2" : "gap-1";
  return (
    <div className={`flex flex-col-reverse ${gap} ${className}`} aria-label="괘">
      {lines.map((ln, i) => {
        const visible = i < shown;
        const bar = `block h-full rounded-sm ${ln.changing ? "bg-[var(--color-gold)]" : "bg-[var(--color-ink)]"}`;
        return (
          <div key={i} className={`relative flex items-center ${w} ${h} ${visible ? (animate ? "hex-line-drop" : "") : "hidden"}`}>
            {ln.yang ? (
              <span className={`${bar} w-full`} />
            ) : (
              <>
                <span className={bar} style={{ width: "42%" }} />
                <span className="flex-1" />
                <span className={bar} style={{ width: "42%" }} />
              </>
            )}
            {ln.changing && (
              <span className={`absolute -right-4 font-bold leading-none text-[var(--color-gold)] ${size === "lg" ? "text-[11px]" : "text-[8px] -right-3"}`} aria-label="움직이는 줄">
                {ln.yang ? "○" : "×"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
