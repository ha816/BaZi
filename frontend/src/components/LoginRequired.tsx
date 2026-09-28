import Link from "next/link";

interface Props {
  /** 왜 로그인이 필요한지 한 줄 — "로그인하면 나만의 오늘 운세를 볼 수 있어요" */
  message: string;
  /** 로그인 뒤 돌아올 경로 — "/siun", "/compatibility?invite=…" */
  next: string;
}

/** 로그인 필수 페이지(시운·궁합)의 비로그인 안내 카드. 계정·프로필은 카드 대신 /join redirect. 정책은 CLAUDE.md "로그인 정책" */
export default function LoginRequired({ message, next }: Props) {
  return (
    <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-8 flex flex-col items-center gap-4 text-center">
      <p className="text-5xl">🪄</p>
      <p className="text-base font-semibold text-[var(--color-ink)]">{message}</p>
      <Link
        href={`/join?next=${encodeURIComponent(next)}`}
        className="px-6 py-2.5 rounded-full bg-[var(--color-gold)] text-white text-sm font-semibold"
      >
        로그인 / 가입하기
      </Link>
    </div>
  );
}
