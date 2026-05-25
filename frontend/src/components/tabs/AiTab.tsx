"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { streamAiInterpretation } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import KkachiTip from "@/components/KkachiTip";

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function AiTab({ name }: Props) {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const inputRaw = sessionStorage.getItem("kkachi_analysis_input");
    const sessionName = name ?? sessionStorage.getItem("kkachi_analysis_name") ?? "";
    if (!inputRaw) {
      setError(true);
      setStreaming(false);
      return;
    }

    streamAiInterpretation(JSON.parse(inputRaw), sessionName, (accumulated) => {
      setText(accumulated);
    })
      .catch(() => setError(true))
      .finally(() => setStreaming(false));
  }, [name]);

  const isLoading = streaming && !text;

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader title="까치의 AI 사주 풀이" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-3">
          <KkachiTip>
            {name ? `${name}님의 ` : ""}사주팔자·오행·용신·대운·세운 데이터를 까치가 한 편의 글로 풀어드려요.
            룰 엔진이 계산한 구조 위에 AI가 이야기를 입혀요.
          </KkachiTip>

          {error && !text && (
            <p className="text-sm text-[var(--color-ink-faint)] leading-relaxed">
              AI 풀이를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          )}

          {isLoading && !error && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border-light)]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[var(--color-gold)] animate-spin" />
              </div>
              <p className="text-sm text-[var(--color-ink-faint)] text-center">
                까치가 사주를 풀어내고 있어요…
              </p>
            </div>
          )}

          {text && (
            <div className="prose-saju text-sm text-[var(--color-ink-light)] leading-relaxed">
              <ReactMarkdown>{text}</ReactMarkdown>
              {streaming && (
                <span className="animate-pulse text-[var(--color-ink-faint)]"> ▍</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
