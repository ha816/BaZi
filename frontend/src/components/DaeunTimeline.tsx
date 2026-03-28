"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { DaeunPeriod } from "@/types/analysis";

interface Props {
  daeun: DaeunPeriod[];
}

export default function DaeunTimeline({ daeun }: Props) {
  const data = daeun.map((d) => ({
    label: `${d.ganji}\n(${d.start_age}~${d.end_age}세)`,
    score: d.has_yongshin ? 2 : 0,
    color: d.is_current ? "#FF6B6B" : d.has_yongshin ? "#4CAF50" : "#B0BEC5",
    is_current: d.is_current,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">대운 타임라인</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {daeun.map((d) => (
          <div
            key={d.ganji}
            className={`flex-shrink-0 rounded-xl px-4 py-3 text-center min-w-[90px] border-2 ${
              d.is_current
                ? "border-red-400 bg-red-50"
                : d.has_yongshin
                ? "border-green-400 bg-green-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="text-lg font-bold">{d.ganji}</div>
            <div className="text-xs text-gray-500">
              {d.start_age}~{d.end_age}세
            </div>
            {d.has_yongshin && (
              <div className="text-xs text-green-600 font-semibold mt-1">
                용신 ✓
              </div>
            )}
            {d.is_current && (
              <div className="text-xs text-red-500 font-semibold mt-1">
                현재
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
