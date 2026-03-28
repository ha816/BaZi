"use client";

import { useState } from "react";
import type { AnalysisInput } from "@/types/analysis";

interface Props {
  onSubmit: (input: AnalysisInput) => void;
  loading: boolean;
}

export default function AnalysisForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<AnalysisInput>({
    birth_year: 1990,
    birth_month: 1,
    birth_day: 1,
    birth_hour: 12,
    birth_minute: 0,
    gender: "male",
    analysis_year: new Date().getFullYear(),
  });

  const update = (key: keyof AnalysisInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-5"
    >
      <h2 className="text-xl font-bold text-gray-800">생년월일시 입력</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <label className="space-y-1">
          <span className="text-sm text-gray-600">출생년도</span>
          <input
            type="number"
            value={form.birth_year}
            onChange={(e) => update("birth_year", +e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min={1920}
            max={2025}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">월</span>
          <input
            type="number"
            value={form.birth_month}
            onChange={(e) => update("birth_month", +e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min={1}
            max={12}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">일</span>
          <input
            type="number"
            value={form.birth_day}
            onChange={(e) => update("birth_day", +e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min={1}
            max={31}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">시</span>
          <input
            type="number"
            value={form.birth_hour}
            onChange={(e) => update("birth_hour", +e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min={0}
            max={23}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">분</span>
          <input
            type="number"
            value={form.birth_minute}
            onChange={(e) => update("birth_minute", +e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min={0}
            max={59}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-600">분석 연도</span>
          <input
            type="number"
            value={form.analysis_year}
            onChange={(e) => update("analysis_year", +e.target.value)}
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
            checked={form.gender === "male"}
            onChange={() => update("gender", "male")}
          />
          <span>남성</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            checked={form.gender === "female"}
            onChange={() => update("gender", "female")}
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
