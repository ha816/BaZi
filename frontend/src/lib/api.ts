import type {
  AnalysisInput,
  AnalysisResult,
  CompatibilityInput,
  CompatibilityResult,
  DailyFortune,
  DailyWeather,
  Member,
  PalmistryResult,
  PersonInput,
  Profile,
  ProfileCreateInput,
  ProfileUpdateInput,
  RelationType,
} from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function analyzeChart(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/kkachi/interpret`, {
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

export async function streamChat(
  input: AnalysisInput,
  name: string,
  messages: { role: string; content: string }[],
  onChunk: (accumulated: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/kkachi/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, name, messages }),
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }
}

export async function streamAiInterpretation(
  input: AnalysisInput,
  name: string,
  onChunk: (accumulated: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/kkachi/stream-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, name }),
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }
}

export async function analyzePalmistry(file: File): Promise<PalmistryResult> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/palmistry/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail ?? "분석 중 오류가 발생했습니다.");
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

export async function updateProfile(memberId: string, profileId: string, data: ProfileUpdateInput): Promise<Profile> {
  return request<Profile>(`/members/${memberId}/profiles/${profileId}`, {
    method: "PATCH",
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
  year: number,
  relationType: import("@/types/analysis").RelationType = "lover",
): Promise<CompatibilityResult> {
  return request<CompatibilityResult>("/compatibility", {
    method: "POST",
    body: JSON.stringify({
      profile_id_1: profileId1,
      profile_id_2: profileId2,
      year,
      relation_type: relationType,
    }),
  });
}

export async function getDailyFortune(memberId: string, profileId: string): Promise<DailyFortune> {
  return request<DailyFortune>(`/members/${memberId}/profiles/${profileId}/daily`);
}

export async function getWeather(city: string): Promise<DailyWeather[]> {
  const data = await request<DailyWeather[] | { days: DailyWeather[] }>(`/weather?city=${encodeURIComponent(city)}&days=3`);
  return Array.isArray(data) ? data : (data.days ?? []);
}

export async function getForecast(memberId: string, profileId: string, days = 7, startDate?: string): Promise<DailyFortune[]> {
  const query = new URLSearchParams({ days: days.toString() });
  if (startDate) query.append("start_date", startDate);
  return request<DailyFortune[]>(`/members/${memberId}/profiles/${profileId}/forecast?${query.toString()}`);
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

export async function streamCompatibilityChat(
  input: CompatibilityInput,
  messages: { role: string; content: string }[],
  onChunk: (accumulated: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/compatibility/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, messages }),
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }
}

export async function streamCompatibilityNarrative(
  input: CompatibilityInput,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_URL}/compatibility/narrative`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }
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

export async function getFeedbackMap(memberId: string, profileId: string, prefix = "daily:"): Promise<Record<string, number>> {
  return request<Record<string, number>>(
    `/members/${memberId}/profiles/${profileId}/feedback?prefix=${encodeURIComponent(prefix)}`
  );
}

export async function listAnalysisYears(memberId: string, profileId: string): Promise<number[]> {
  const rows = await request<{ year: number; created_at: string }[]>(`/members/${memberId}/profiles/${profileId}/analyses`);
  return rows.map((r) => r.year);
}

export interface FeedbackSummary {
  tab_id: string;
  total: number;
  positive: number;
  negative: number;
  positive_rate: number;
}

const ADMIN_TOKEN_KEY = "kkachi_admin_token";

/** /admin/* 호출용. 서버에 KKACHI_ADMIN_TOKEN이 있으면 401 → 토큰을 물어 localStorage에 두고 재시도. */
async function adminRequest<T>(path: string): Promise<T> {
  const attempt = () => {
    let token: string | null = null;
    try { token = localStorage.getItem(ADMIN_TOKEN_KEY); } catch { /* ignore */ }
    return fetch(`${API_URL}${path}`, { headers: token ? { "X-Admin-Token": token } : {} });
  };
  let res = await attempt();
  if (res.status === 401) {
    const entered = window.prompt("관리자 토큰을 입력하세요 (KKACHI_ADMIN_TOKEN)");
    if (entered) {
      try { localStorage.setItem(ADMIN_TOKEN_KEY, entered.trim()); } catch { /* ignore */ }
      res = await attempt();
    }
  }
  if (!res.ok) throw new Error(res.status === 401 ? "관리자 토큰이 맞지 않아요." : await res.text());
  return res.json();
}

export async function getFeedbackSummary(): Promise<FeedbackSummary[]> {
  return adminRequest<FeedbackSummary[]>("/admin/feedback/summary");
}


export interface EventSummary {
  name: string;
  count: number;
  sessions: number;
}

export async function getEventSummary(days = 7): Promise<EventSummary[]> {
  return adminRequest<EventSummary[]>(`/admin/events/summary?days=${days}`);
}

export async function getVapidPublicKey(): Promise<{ public_key: string }> {
  return request<{ public_key: string }>("/push/vapid-public-key");
}

export async function savePushSubscription(
  memberId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<void> {
  await request<{ success: boolean }>("/push/subscriptions", {
    method: "POST",
    body: JSON.stringify({ member_id: memberId, subscription }),
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const res = await fetch(`${API_URL}/push/subscriptions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) throw new Error("구독 해제 실패");
}

export interface DailyCompat {
  date: string;
  day_pillar: string;
  score: number;
  level: string;
  headline: string;
}

export async function getDailyCompat(memberId: string, p1: string, p2: string): Promise<DailyCompat> {
  return request<DailyCompat>(`/compatibility/daily?member_id=${memberId}&p1=${p1}&p2=${p2}`);
}

export async function createCompatInvite(person1: PersonInput, relationType: RelationType): Promise<{ invite_id: string }> {
  return request<{ invite_id: string }>("/compatibility/invites", {
    method: "POST",
    body: JSON.stringify({ person1, relation_type: relationType }),
  });
}

export async function getCompatInvite(inviteId: string): Promise<{ name: string; relation_type: RelationType }> {
  return request<{ name: string; relation_type: RelationType }>(`/compatibility/invites/${inviteId}`);
}

export async function resolveCompatInvite(inviteId: string, person2: PersonInput, year: number): Promise<CompatibilityResult> {
  return request<CompatibilityResult>(`/compatibility/invites/${inviteId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ person2, year }),
  });
}
