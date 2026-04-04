"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisInput, AnalysisResult } from "@/types/analysis";
import { analyzeChart } from "@/lib/api";
import AnalysisForm from "@/components/AnalysisForm";
import ResultSlides from "@/components/ResultSlides";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: AnalysisInput) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeChart(input);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Counselor image */}
          <div className="flex-shrink-0">
            <img
              src="/counselor.png"
              alt="명리 상담사"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-[var(--color-border-light)] shadow-md"
            />
          </div>
          {/* Text */}
          <div className="text-center md:text-left space-y-3 flex-1">
            <p className="text-xs tracking-[0.3em] text-[var(--color-gold)]">
              命理相談
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--color-ink)] tracking-tight">
              사주명리 상담
            </h1>
            <p className="text-base text-[var(--color-ink-muted)] leading-relaxed">
              안녕하세요, 명리 상담사입니다.<br className="hidden md:block" />
              생년월일시를 알려주시면 타고난 기운과 올해의 운세를 풀어드릴게요.
            </p>
            <Link
              href="/compatibility"
              className="inline-block text-sm text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors"
            >
              💕 사주 궁합 보기 →
            </Link>
          </div>
        </header>

        <AnalysisForm onSubmit={handleSubmit} loading={loading} />

        {loading && <LoadingSpinner />}

        {error && (
          <div
            className="rounded-lg px-5 py-4 text-base text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}
          >
            {error}
          </div>
        )}

        {result && !loading && <ResultSlides data={result} />}
      </div>
    </main>
  );
}
