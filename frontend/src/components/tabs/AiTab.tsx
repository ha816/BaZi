"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { streamAiInterpretation } from "@/lib/api";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

type AiState = "loading" | "done" | "error";

export default function AiTab({ name }: Props) {
  const [state, setState] = useState<AiState>("loading");
  const [text, setText] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const inputRaw = sessionStorage.getItem("kkachi_analysis_input");
    const sessionName = name ?? sessionStorage.getItem("kkachi_analysis_name") ?? "";
    if (!inputRaw) {
      setState("error");
      return;
    }

    streamAiInterpretation(JSON.parse(inputRaw), sessionName, (accumulated) => {
      setText(accumulated);
      setState("done");
    }).catch(() => setState("error"));
  }, [name]);

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <CollapsibleSectionHeader title="AI 사주 풀이(人工知能 四柱 解說)">
          사주팔자·오행·용신·대운·세운 데이터를 <strong className="text-[var(--color-ink)]">AI</strong>에 전달해
          자연스러운 언어로 풀어낸 종합 해석이에요.
          룰 엔진이 계산한 구조 위에 AI가 이야기를 입혀드려요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          {state === "loading" && (
            <>
              <KkachiTip>
                까치가 사주 전체를 읽고 있어요. 잠시만 기다려주세요 (1~2분 소요).
              </KkachiTip>
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border-light)]" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[var(--color-gold)] animate-spin" />
                </div>
                <p className="text-sm text-[var(--color-ink-faint)] text-center">
                  사주를 분석하고 있어요…
                </p>
              </div>
            </>
          )}

          {state === "error" && (
            <KkachiTip>
              AI 풀이를 불러오지 못했어요. Ollama가 실행 중인지 확인하거나 잠시 후 다시 시도해주세요.
            </KkachiTip>
          )}

          {state === "done" && text && (
            <>
              <KkachiTip>
                {name ? `${name}님의 ` : ""}사주를 AI가 풀어드렸어요. 참고 자료로 활용해보세요.
              </KkachiTip>
              <div className="prose-saju text-sm text-[var(--color-ink-light)] leading-relaxed">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
