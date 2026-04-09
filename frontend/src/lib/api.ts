import type {
  AnalysisInput,
  AnalysisResult,
  BasicResult,
  CompatibilityInput,
  CompatibilityResult,
  DailyFortune,
  DailyWeather,
  Member,
  Profile,
  ProfileCreateInput,
} from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getBasicChart(input: AnalysisInput): Promise<BasicResult> {
  const { analysis_year, ...rest } = input;
  const res = await fetch(`${API_URL}/saju/basic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...rest, year: analysis_year }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

export async function analyzeChart(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/saju/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

export async function createOrGetMember(name: string, email: string): Promise<Member> {
  return request<Member>("/members", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
}

export async function getMember(memberId: string): Promise<Member> {
  return request<Member>(`/members/${memberId}`);
}

export async function deleteMember(memberId: string): Promise<void> {
  const res = await fetch(`${API_URL}/members/${memberId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("탈퇴 실패");
}

export async function listProfiles(memberId: string): Promise<Profile[]> {
  return request<Profile[]>(`/members/${memberId}/profiles`);
}

export async function createProfile(memberId: string, data: ProfileCreateInput): Promise<Profile> {
  return request<Profile>(`/members/${memberId}/profiles`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteProfile(memberId: string, profileId: string): Promise<void> {
  const res = await fetch(`${API_URL}/members/${memberId}/profiles/${profileId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("삭제 실패");
}

export async function analyzeProfileChart(
  memberId: string,
  profileId: string,
  year: number
): Promise<AnalysisResult> {
  return request<AnalysisResult>(`/members/${memberId}/profiles/${profileId}/analyze`, {
    method: "POST",
    body: JSON.stringify({ year }),
  });
}

export async function analyzeCompatibilityByProfiles(
  profileId1: string,
  profileId2: string,
  year: number
): Promise<CompatibilityResult> {
  return request<CompatibilityResult>("/compatibility", {
    method: "POST",
    body: JSON.stringify({ profile_id_1: profileId1, profile_id_2: profileId2, year }),
  });
}

export async function getDailyFortune(memberId: string, profileId: string): Promise<DailyFortune> {
  return request<DailyFortune>(`/members/${memberId}/profiles/${profileId}/daily`);
}

export async function getWeather(city: string): Promise<{ city: string; days: DailyWeather[] }> {
  return request<{ city: string; days: DailyWeather[] }>(`/weather?city=${encodeURIComponent(city)}`);
}

export async function getForecast(memberId: string, profileId: string, days = 7): Promise<DailyFortune[]> {
  return request<DailyFortune[]>(`/members/${memberId}/profiles/${profileId}/forecast?days=${days}`);
}

export async function analyzeCompatibility(
  input: CompatibilityInput
): Promise<CompatibilityResult> {
  const res = await fetch(`${API_URL}/compatibility/direct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

export async function postFeedback(
  memberId: string,
  profileId: string,
  tabId: string,
  rating: number
): Promise<void> {
  await request<{ success: boolean }>(
    `/members/${memberId}/profiles/${profileId}/feedback`,
    { method: "POST", body: JSON.stringify({ tab_id: tabId, rating }) }
  );
}

export async function preparePayment(params: {
  member_id: string;
  feature_type: "deep_analysis" | "daily_fortune" | "compatibility";
}): Promise<{ order_id: string; amount: number; feature_type: string; order_name: string }> {
  return request("/payments/prepare", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function confirmPayment(params: {
  payment_key: string;
  order_id: string;
  amount: number;
}): Promise<{ success: boolean }> {
  return request("/payments/confirm", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
