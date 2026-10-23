"use client";

import { useCallback, useRef, useState } from "react";
import type { AnalysisInput } from "@/types/analysis";
import { StreamUnavailableError, streamAiInterpretation, streamProfileAiReport } from "@/lib/api";

export type AiReportStatus = "idle" | "streaming" | "done" | "unavailable" | "error";

/** ResultSlides → AiTab에 내려 주는 묶음 */
export interface AiReportState {
  text: string;
  status: AiReportStatus;
  onRetry: () => void;
}

export interface AiReportStart {
  input: AnalysisInput;
  name: string;
  /** 둘 다 있으면 프로필 엔드포인트(서버가 analyses 캐시에 저장) */
  memberId?: string;
  profileId?: string;
  year: number;
  /** analyze 응답에 실려 온 글(프로필 캐시) — 있으면 스트림을 열지 않는다 */
  cached?: string | null;
}

// 직접 입력용 — 같은 입력·이름이면 새로고침·탭 재방문에도 다시 만들지 않는다
const CACHE_KEY = "kkachi_ai_report";

function cacheKey(s: AiReportStart): string {
  return JSON.stringify({ input: s.input, name: s.name });
}

function readCache(key: string): string | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const saved = raw ? (JSON.parse(raw) as { key?: string; text?: string }) : null;
    return saved?.key === key && typeof saved.text === "string" && saved.text ? saved.text : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, text: string) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, text }));
  } catch {
    /* 저장소 막힘 — 캐시 없이 진행 */
  }
}

/**
 * AI 풀이 스트림 상태. 결과가 뜨자마자 페이지가 start()로 미리 시작하고(궁합 AI 해석과 같은 구조),
 * 상태를 페이지가 들고 있어 탭을 오가도 글이 유지된다. 503은 "까치 서버 꺼짐"으로 구분한다.
 */
export function useAiReport() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<AiReportStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef<AiReportStart | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    lastRef.current = null;
    setText("");
    setStatus("idle");
  }, []);

  const start = useCallback((s: AiReportStart) => {
    abortRef.current?.abort();
    lastRef.current = s;
    if (s.cached) {
      setText(s.cached);
      setStatus("done");
      return;
    }
    const { memberId, profileId } = s;
    const byProfile = !!memberId && !!profileId;
    const key = cacheKey(s);
    if (!byProfile) {
      const hit = readCache(key);
      if (hit) {
        setText(hit);
        setStatus("done");
        return;
      }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setText("");
    setStatus("streaming");
    const onChunk = (acc: string) => {
      if (abortRef.current === controller) setText(acc);
    };
    const run = memberId && profileId
      ? streamProfileAiReport(memberId, profileId, s.year, onChunk, controller.signal)
      : streamAiInterpretation(s.input, s.name, onChunk, controller.signal);
    run
      .then((full) => {
        if (abortRef.current !== controller) return;
        setText(full);
        setStatus(full ? "done" : "error");
        if (!byProfile && full) writeCache(key, full);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || abortRef.current !== controller) return;
        setStatus(e instanceof StreamUnavailableError && e.status === 503 ? "unavailable" : "error");
      });
  }, []);

  const retry = useCallback(() => {
    if (lastRef.current) start({ ...lastRef.current, cached: null });
  }, [start]);

  return { text, status, start, reset, retry };
}
