"use client";

import { useState } from "react";
import type { AnalysisInput, AnalysisResponse } from "@/types/analysis";
import { analyzeChart } from "@/lib/api";
import AnalysisForm from "@/components/AnalysisForm";
import PillarCard from "@/components/PillarCard";
import ElementRadar from "@/components/ElementRadar";
import DaeunTimeline from "@/components/DaeunTimeline";
import DomainBarChart from "@/components/DomainBarChart";
import InterpretSection from "@/components/InterpretSection";

const PILLAR_LABELS = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
const OHENG_EMOJI: Record<string, string> = {
  "木": "🌳", "火": "🔥", "土": "⛰️", "金": "🪙", "水": "💧",
};

export default function Home() {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
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
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          사주팔자 분석기
        </h1>

        <AnalysisForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {result && <ResultView data={result} />}
      </div>
    </main>
  );
}

function ResultView({ data }: { data: AnalysisResponse }) {
  const { saju, natal, postnatal, interpretation } = data;
  const me = natal.my_main_element;
  const yong = natal.yongshin;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">사주 원국</h2>
        <div className="grid grid-cols-4 gap-3">
          {saju.pillars.map((pillar, i) => (
            <PillarCard key={i} label={PILLAR_LABELS[i]} pillar={pillar} />
          ))}
        </div>
      </section>

      <ElementRadar stats={natal.element_stats} />

      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-xs text-gray-500">일간 오행</div>
          <div className="text-2xl mt-1">
            {OHENG_EMOJI[me.name]} {me.name}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-xs text-gray-500">강약</div>
          <div className="text-lg font-semibold mt-1">
            {natal.strength.label} ({natal.strength.value > 0 ? "+" : ""}
            {natal.strength.value})
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-xs text-gray-500">용신(用神)</div>
          <div className="text-2xl mt-1">
            {OHENG_EMOJI[yong.name]} {yong.name}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          {postnatal.year}년 세운 — {postnatal.seun_ganji}
        </h3>
        <div className="flex gap-3 mb-3">
          {postnatal.yongshin_in_seun ? (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              세운에 용신({yong.name}) 포함
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
              세운에 용신 없음
            </span>
          )}
          {postnatal.yongshin_in_daeun ? (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              대운에 용신({yong.name}) 포함
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
              대운에 용신 없음
            </span>
          )}
        </div>
        <div className="space-y-1 text-sm text-gray-700">
          <div>
            천간 {postnatal.seun_stem.char}({postnatal.seun_stem.sipsin_name}): {postnatal.seun_stem.domain}
          </div>
          <div>
            지지 {postnatal.seun_branch.char}({postnatal.seun_branch.sipsin_name}): {postnatal.seun_branch.domain}
          </div>
        </div>
      </section>

      <DaeunTimeline daeun={postnatal.daeun} />

      {(postnatal.seun_clashes.length > 0 || postnatal.daeun_clashes.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800">충(衝) 감지</h3>
          {[...postnatal.seun_clashes, ...postnatal.daeun_clashes].map((c, i) => (
            <div key={i} className="bg-red-50 border-l-4 border-red-400 rounded-lg px-4 py-2 text-sm text-red-700">
              {c.incoming} ↔ {c.target} ({c.pillar})
            </div>
          ))}
        </section>
      )}
      {(postnatal.seun_combines.length > 0 || postnatal.daeun_combines.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800">합(合) 감지</h3>
          {[...postnatal.seun_combines, ...postnatal.daeun_combines].map((c, i) => (
            <div key={i} className="bg-green-50 border-l-4 border-green-400 rounded-lg px-4 py-2 text-sm text-green-700">
              {c.incoming} ↔ {c.target} ({c.pillar}, {c.type})
            </div>
          ))}
        </section>
      )}

      <DomainBarChart scores={postnatal.domain_scores} />

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">종합 해석</h2>
        <InterpretSection title="성격·기질" lines={interpretation.personality} variant="info" />
        <InterpretSection title="오행 밸런스" lines={interpretation.element_balance} />
        <InterpretSection title="용신 분석" lines={interpretation.yongshin} />
        <InterpretSection title="영역별 운세" lines={interpretation.fortune_by_domain} />
        <InterpretSection title="올해 운세" lines={interpretation.annual_fortune} />
        <InterpretSection title="대운 흐름" lines={interpretation.major_fortune} />
        <InterpretSection title="충·합 관계" lines={interpretation.relationships} variant="warning" />
        <InterpretSection title="종합 조언" lines={interpretation.advice} variant="success" />
      </section>
    </div>
  );
}
