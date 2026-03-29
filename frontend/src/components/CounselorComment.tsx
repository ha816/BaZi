"use client";

interface Props {
  children: React.ReactNode;
  /** "greeting" = 인사 이미지, "explain" = 설명 이미지 */
  pose?: "greeting" | "explain";
}

/**
 * 명리 상담사가 말하는 것처럼 보이는 말풍선 컴포넌트.
 * 결과 섹션 사이에 배치하여 캐릭터가 풀이를 이어가는 느낌을 줌.
 */
export default function CounselorComment({ children, pose = "explain" }: Props) {
  const src = pose === "greeting" ? "/counselor.png" : "/counselor-explain.png";

  return (
    <div className="flex items-start gap-4 py-2">
      {/* Avatar */}
      <img
        src={src}
        alt="명리 상담사"
        className="w-12 h-12 rounded-full object-cover border border-[var(--color-border-light)] shadow-sm flex-shrink-0 mt-1"
      />
      {/* Speech bubble */}
      <div className="relative flex-1 bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
