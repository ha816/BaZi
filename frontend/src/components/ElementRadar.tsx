"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const EMOJI: Record<string, string> = {
  "木": "🌳", "火": "🔥", "土": "⛰️", "金": "🪙", "水": "💧",
};

interface Props {
  stats: Record<string, number>;
}

export default function ElementRadar({ stats }: Props) {
  const data = Object.entries(stats).map(([name, value]) => ({
    name: `${EMOJI[name] ?? ""} ${name}`,
    value,
  }));
  const maxVal = Math.max(...Object.values(stats)) + 1;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-2">오행 분포</h3>
      <div className="flex justify-center gap-4 mb-4">
        {Object.entries(stats).map(([name, count]) => (
          <div key={name} className="text-center">
            <div className="text-2xl">{EMOJI[name]}</div>
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-lg font-bold text-indigo-600">{count}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 13 }} />
          <PolarRadiusAxis domain={[0, maxVal]} tickCount={maxVal + 1} />
          <Radar
            dataKey="value"
            stroke="#636EFA"
            fill="#636EFA"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
