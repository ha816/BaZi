"use client";

import { useState } from "react";
import type { AnalysisInput } from "@/types/analysis";
import { createShare } from "@/lib/api";
import { track } from "@/lib/track";

interface Props {
  input: AnalysisInput;
  name: string;
}

const PANEL_BTN =
  "px-2 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-ivory-warm)] transition-colors";

/** 결과 공유 — 서버에 카드 스냅샷(/kkachi/shares)을 만들고 /s/{id} 링크를 공유한다.
 *  이미지는 그 링크의 OG 이미지(/s/{id}/opengraph-image)를 그대로 쓴다. */
export default function ShareButton({ input, name }: Props) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const who = name ? `${name}님` : "나";
  const title = `${who}의 사주 카드`;
  const text = `${who}의 사주, 사주까치가 이렇게 봤어요. 나도 30초 만에 →`;

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
        const { share_id } = await createShare(input, name);
        link = `${window.location.origin}/s/${share_id}`;
        setUrl(link);
        track("share_click", { channel: "result" });
      }
      setOpen(true);
      try {
        if (navigator.share) await navigator.share({ title, text, url: link });
        else {
          await navigator.clipboard.writeText(link);
          flash("링크를 복사했어요");
        }
      } catch {
        // 사용자가 공유 시트를 닫음
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      flash("링크를 복사했어요");
    } catch {
      flash("복사에 실패했어요");
    }
  };

  // 모바일에서 이미지 파일 자체를 카톡·인스타로 — 지원 안 하면 '이미지 저장' 안내
  const handleShareImage = async () => {
    if (!url) return;
    try {
      const blob = await (await fetch(`${url}/opengraph-image`)).blob();
      const files = [new File([blob], "sajukkachi.png", { type: "image/png" })];
      if (navigator.canShare?.({ files })) await navigator.share({ files, title, text });
      else flash("이미지 공유가 안 되는 브라우저예요. '이미지 저장'을 써 주세요");
    } catch {
      // 취소
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
        {busy ? "만드는 중…" : "공유"}
      </button>
      {error && (
        <p className="absolute right-0 mt-1 text-[11px] text-[var(--color-fire)] whitespace-nowrap">공유 링크를 만들지 못했어요</p>
      )}
      {open && url && (
        <div className="absolute right-0 mt-2 z-40 w-[min(92vw,340px)] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] shadow-lg p-3 space-y-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-1.5 right-2 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            aria-label="닫기"
          >
            ✕
          </button>
          <p className="text-xs font-semibold text-[var(--color-ink)]">내 사주 카드</p>
          <img
            src={`${url}/opengraph-image`}
            alt="공유 카드 미리보기"
            className="w-full rounded-lg border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)]"
          />
          <p className="text-[11px] text-[var(--color-ink-muted)] break-all">{url}</p>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button type="button" onClick={handleCopy} className={PANEL_BTN}>링크 복사</button>
            <button type="button" onClick={handleShareImage} className={PANEL_BTN}>이미지로 공유</button>
            <a href={`${url}/opengraph-image`} download="sajukkachi.png" className={`${PANEL_BTN} text-center`}>이미지 저장</a>
          </div>
          {notice && <p className="text-[11px] text-center text-[var(--color-gold)]">{notice}</p>}
        </div>
      )}
    </div>
  );
}
