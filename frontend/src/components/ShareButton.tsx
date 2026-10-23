"use client";

import { useState } from "react";
import { track } from "@/lib/track";

interface Props {
  /** 서버에 카드 스냅샷을 만들고 share_id를 돌려주는 호출 (사주: createShare, 시운: createDailyShare, 궁합: createCompatShare) */
  create: () => Promise<{ share_id: string }>;
  /** 공유 시트 제목·문구 */
  title: string;
  text: string;
  /** 버튼 글자 (기본 "공유") */
  label?: string;
  /** 이벤트 채널 구분 */
  channel?: string;
}

/** 공유 버튼 — create()로 카드 스냅샷을 만들고 /s/{id} 링크를 공유한다 (분석 결과·시운·궁합 공용).
 *  휴대폰은 공유 시트(navigator.share), 없으면 링크를 클립보드에 복사. 받는 쪽 미리보기는 /s/{id}/opengraph-image.
 *  공유 뒤에는 카드 미리보기만 띄운다 — 링크 복사·이미지로 공유·이미지 저장 버튼은 2026-10-23 뺐다(공유 시트와 같은 일을 한 번 더 해서, 사용자 결정) */
export default function ShareButton({ create, title, text, label = "공유", channel = "result" }: Props) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 1800);
  };

  // 링크 생성은 한 번만 — 다시 누르면 같은 링크를 공유한다
  const handleShare = async () => {
    setBusy(true);
    setError(false);
    try {
      let link = url;
      if (!link) {
        const { share_id } = await create();
        link = `${window.location.origin}/s/${share_id}`;
        setUrl(link);
        track("share_click", { channel });
      }
      setOpen(true);
      try {
        if (navigator.share) await navigator.share({ title, text, url: link });
        else {
          await navigator.clipboard.writeText(link);
          flash("링크를 복사했어요");
        }
      } catch (e) {
        // 사용자가 공유 시트를 닫으면 AbortError — 그 밖의 실패(권한 등)는 복사로 대신
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          try {
            await navigator.clipboard.writeText(link);
            flash("링크를 복사했어요");
          } catch {
            flash("공유하지 못했어요");
          }
        }
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--color-ink)] text-[var(--color-ivory)] hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors"
      >
        {busy ? "만드는 중…" : label}
      </button>
      {error && (
        <p className="absolute right-0 mt-1 text-[11px] text-[var(--color-fire)] whitespace-nowrap">공유 링크를 만들지 못했어요</p>
      )}
      {open && url && (
        <div className="fixed inset-x-4 top-16 z-50 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-[340px] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] shadow-lg p-3 space-y-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-1.5 right-2 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            aria-label="닫기"
          >
            ✕
          </button>
          <img
            src={`${url}/opengraph-image`}
            alt="공유 카드 미리보기"
            className="w-full mt-4 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)]"
          />
          {notice && <p className="text-[11px] text-center text-[var(--color-gold)]" role="status">{notice}</p>}
        </div>
      )}
      {notice && !error && !open && (
        <p className="absolute right-0 mt-1 text-[11px] text-[var(--color-gold)] whitespace-nowrap" role="status">{notice}</p>
      )}
    </div>
  );
}
