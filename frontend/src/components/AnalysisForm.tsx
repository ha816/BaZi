"use client";

import { useState } from "react";
import type { AnalysisInput } from "@/types/analysis";

interface Props {
  onSubmit: (input: AnalysisInput) => void;
  loading: boolean;
}

export default function AnalysisForm({ onSubmit, loading }: Props) {
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [birthTime, setBirthTime] = useState("12:00");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      birth_dt: `${birthDate}T${birthTime}:00`,
      gender,
      analysis_year: analysisYear,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-5"
    >
      <h2 className="text-xl font-bold text-gray-800">생년월일시 입력</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <label className="space-y-1">
          <span className="text-sm text-gray-600">생년월일</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min="1920-01-01"
            max="2025-12-31"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">태어난 시각</span>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">분석 연도</span>
          <input
            type="number"
            value={analysisYear}
            onChange={(e) => setAnalysisYear(+e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min={1920}
            max={2100}
          />
        </label>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            checked={gender === "male"}
            onChange={() => setGender("male")}
          />
          <span>남성</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            checked={gender === "female"}
            onChange={() => setGender("female")}
          />
          <span>여성</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition"
      >
        {loading ? "분석 중..." : "분석하기"}
      </button>
    </form>
  );
}
