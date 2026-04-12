"use client";

import { useRef, useState } from "react";
import type { PalmistryResult, PalmLineScores } from "@/types/analysis";
import { analyzePalmistry } from "@/lib/api";
import { getElementInfo } from "@/lib/elementColors";
import InterpretSection from "@/components/InterpretSection";
import KkachiTip from "@/components/KkachiTip";

type Stage = "idle" | "preview" | "loading" | "result" | "error";

const GUIDE_ITEMS = [
  { emoji: "💡", text: "밝은 곳에서 촬영해주세요" },
  { emoji: "🤚", text: "손바닥이 카메라를 정면으로 향하도록" },
  { emoji: "✋", text: "손가락을 자연스럽게 펼쳐주세요" },
  { emoji: "📐", text: "손 전체가 화면에 다 들어오도록" },
];

export default function PalmistryPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PalmistryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStage("preview");
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStage("loading");
    try {
      const data = await analyzePalmistry(file);
      setResult(data);
      setStage("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
      setStage("error");
    }
  };

  const handleReset = () => {
    setStage("idle");
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const elemInfo = result ? getElementInfo(result.hand_element) : null;

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* 헤더 */}
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">손금 분석</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            손의 형태로 나의 오행 기운을 알아보세요
          </p>
        </header>

        {/* idle — 촬영 가이드 + 업로드 */}
        {(stage === "idle" || stage === "preview") && (
          <>
            {/* 촬영 가이드 */}
            <div className="slide-card">
              <div className="slide-card__header">
                <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
                  이렇게 찍어주세요
                </h3>
              </div>
              <div className="divider" />
              <div className="slide-card__body">
                <div className="grid grid-cols-2 gap-3">
                  {GUIDE_ITEMS.map((g) => (
                    <div
                      key={g.text}
                      className="flex items-start gap-2 rounded-lg p-3 bg-[var(--color-ivory)]"
                    >
                      <span className="text-xl leading-none">{g.emoji}</span>
                      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{g.text}</p>
                    </div>
                  ))}
                </div>
                <KkachiTip label="손금 팁">
                  어두운 곳이나 손이 일부만 나오면 감지가 어려울 수 있어요. 손바닥 전체가 잘 보이도록 찍어주세요.
                </KkachiTip>
              </div>
            </div>

            {/* 업로드 영역 */}
            <div className="slide-card">
              <div className="slide-card__body space-y-4">
                {stage === "preview" && previewUrl ? (
                  <>
                    <div className="rounded-xl overflow-hidden bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="손 사진 미리보기"
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-ivory)] transition-colors"
                      >
                        다시 찍기
                      </button>
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        className="flex-2 flex-grow-[2] py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: "var(--color-gold)" }}
                      >
                        분석 시작
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {/* 카메라 촬영 */}
                    <label className="block">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                      <span
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-sm text-white cursor-pointer transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "var(--color-gold)" }}
                      >
                        <span className="text-xl">📸</span>
                        카메라로 찍기
                      </span>
                    </label>

                    {/* 파일 업로드 */}
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                      <span className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-sm text-[var(--color-ink-muted)] border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-ivory)] transition-colors">
                        <span className="text-xl">🖼️</span>
                        갤러리에서 선택
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 현재 버전 안내 */}
            <p className="text-center text-xs text-[var(--color-ink-faint)]">
              현재 버전은 손의 형태(손가락 길이·손바닥 비율)로 오행형을 분류합니다.
              <br />추후 손금선 정밀 분석 기능이 추가될 예정입니다.
            </p>
          </>
        )}

        {/* loading */}
        {stage === "loading" && (
          <div className="slide-card">
            <div className="slide-card__body flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 rounded-full border-4 border-[var(--color-gold)] border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--color-ink-muted)]">손 형태를 분석하는 중...</p>
            </div>
          </div>
        )}

        {/* error */}
        {stage === "error" && (
          <div className="space-y-4">
            <div
              className="rounded-lg px-5 py-4 text-sm text-[var(--color-fire)]"
              style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}
            >
              {errorMsg}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-ivory)] transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {/* result */}
        {stage === "result" && result && elemInfo && (
          <div className="space-y-4">
            {/* 미리보기 썸네일 */}
            {previewUrl && (
              <div className="flex items-center gap-4 slide-card">
                <div className="slide-card__body flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="분석한 손"
                    className="w-20 h-20 rounded-xl object-cover border"
                    style={{ borderColor: elemInfo.borderColor }}
                  />
                  <div className="flex-1 space-y-1">
                    <span
                      className="inline-block text-sm font-bold px-3 py-1 rounded-full"
                      style={{ color: elemInfo.color, backgroundColor: elemInfo.bgColor, border: `1px solid ${elemInfo.borderColor}` }}
                    >
                      {elemInfo.korean}({result.hand_element}) 기운
                    </span>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {result.hand_type_korean}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      손가락 비율 {result.finger_ratio.toFixed(2)} · 손바닥 비율 {result.aspect_ratio.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 손금선 점수 */}
            {result.line_scores && (
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">손금선 분석</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body space-y-3">
                  {(
                    [
                      { key: "heart", label: "감정선", domain: "연애운", color: "#E8769A" },
                      { key: "head",  label: "지능선", domain: "재물운", color: "var(--color-gold)" },
                      { key: "life",  label: "생명선", domain: "건강운", color: "var(--color-wood)" },
                    ] as { key: keyof PalmLineScores; label: string; domain: string; color: string }[]
                  ).map(({ key, label, domain, color }) => {
                    const score = result.line_scores[key];
                    const levelLabel = score >= 75 ? "매우 선명" : score >= 55 ? "뚜렷한 편" : score >= 40 ? "보통" : "흐릿한 편";
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--color-ink)]">
                            {label} <span className="font-normal text-[var(--color-ink-faint)]">· {domain}</span>
                          </span>
                          <span className="text-xs text-[var(--color-ink-muted)]">{levelLabel}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${score}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 해석 블록 */}
            <div className="slide-card">
              <div className="slide-card__body">
                <InterpretSection title="" blocks={result.blocks} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-ivory)] transition-colors"
            >
              다시 분석하기
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
