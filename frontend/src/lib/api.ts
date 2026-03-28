import type { AnalysisInput, AnalysisResult } from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function analyzeChart(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const res = await fetch(`${API_URL}/api/analyze?${params}`, {
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}
