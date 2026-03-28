"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { DomainScore } from "@/types/analysis";

const COLORS: Record<string, string> = {
  high: "#4CAF50",
  medium: "#FF9800",
  low: "#B0BEC5",
};

interface Props {
  scores: Record<string, DomainScore>;
}

export default function DomainBarChart({ scores }: Props) {
  const data = Object.entries(scores).map(([name, info]) => ({
    name,
    score: info.score,
    color: COLORS[info.level] ?? COLORS.low,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">영역별 운세</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, "dataMax + 1"]} allowDecimals={false} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
            <LabelList
              dataKey="score"
              position="top"
              formatter={(v) => `${v}점`}
              style={{ fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
