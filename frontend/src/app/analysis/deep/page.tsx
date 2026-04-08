"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/types/analysis";
import { analyzeChart } from "@/lib/api";
import ResultSlides from "@/components/ResultSlides";
import LoadingSpinner from "@/components/LoadingSpinner";

const MEMBER_ID_KEY = "kkachi_member_id";

export default function DeepAnalysisPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const memberId = localStorage.getItem(MEMBER_ID_KEY);
    if (!memberId) {
      router.replace("/join");
      return;
    }
    setName(sessionStorage.getItem("kkachi_analysis_name") ?? "");
    const raw = sessionStorage.getItem("kkachi_analysis_input");
    if (!raw) {
      router.replace("/analysis");
      return;
    }
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      router.replace("/analysis");
      return;
    }
    analyzeChart(input)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다."));
  }, [router]);

  if (error) return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg px-5 py-4 text-sm text-[var(--color-fire)]"
          style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}>
          {error}
        </div>
      </div>
    </main>
  );

  if (!result) return <LoadingSpinner />;

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">심층분석</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">올해의 운세, 인생 흐름, 종합 조언을 확인하세요.</p>
        </header>
        <Suspense fallback={<LoadingSpinner />}>
          <ResultSlides data={result} name={name} />
        </Suspense>
      </div>
    </main>
  );
}
