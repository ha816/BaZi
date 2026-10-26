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

/** LLM 스트림을 못 연 경우 — 503은 까치 서버(Ollama)가 꺼져 있음 */
export class StreamUnavailableError extends Error {
  status: number;
  constructor(status: number) {
    super(`stream unavailable (${status})`);
    this.status = status;
  }
}

async function readTextStream(res: Response, onChunk: (accumulated: string) => void): Promise<string> {
  if (!res.ok || !res.body) throw new StreamUnavailableError(res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }
  return accumulated;
}

/** AI 풀이(직접 입력) — 백엔드가 같은 입력의 생성을 나눠 주고 최근 글을 기억한다. 완성된 전체 글을 돌려준다 */
export async function streamAiInterpretation(
  input: AnalysisInput,
  name: string,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_URL}/kkachi/stream-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, name }),
    signal,
  });
  return readTextStream(res, onChunk);
}

/** AI 풀이(프로필) — analyses 캐시에 글이 있으면 한 번에 오고, 없으면 생성하며 서버가 저장해 둔다 */
export async function streamProfileAiReport(
  memberId: string,
  profileId: string,
  year: number,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_URL}/members/${memberId}/profiles/${profileId}/ai-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year }),
    signal,
  });
  return readTextStream(res, onChunk);
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
  memberId: string,
  profileId1: string,
  profileId2: string,
  year: number,
  relationType: import("@/types/analysis").RelationType = "lover",
): Promise<CompatibilityResult> {
  return request<CompatibilityResult>("/compatibility", {
    method: "POST",
    body: JSON.stringify({
      member_id: memberId, // 서버가 두 프로필이 이 회원 것인지 확인한다(2026-10-24)
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

/** 궁합 AI 해석 — 프로필 id 둘(+ 회원 id)을 주면 서버가 소유자를 확인하고 compatibilities 캐시에 글을 저장해 두고 다음부터 그대로 준다 */
export async function streamCompatibilityNarrative(
  input: CompatibilityInput,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
  profileIds?: { memberId: string; p1: string; p2: string },
): Promise<string> {
  const res = await fetch(`${API_URL}/compatibility/narrative`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileIds ? { ...input, member_id: profileIds.memberId, profile_id_1: profileIds.p1, profile_id_2: profileIds.p2 } : input),
    signal,
  });
  return readTextStream(res, onChunk);
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
  /** 2026-10-18 보강 — 각자의 오늘(시운과 같은 compute_fortune, 날씨·대운 없이)·영역별 함께 문구·팁. 옛 응답엔 없을 수 있다 */
  day_element?: string;
  solar_term?: string | null;
  son_eomneun_nal?: boolean;
  persons?: { name: string; relation: string; relation_label: string; yongshin: string; yongshin_hit: boolean; score: number; level: string; headline: string; action: string; caution: string }[];
  /** 재물·연애·직업·건강 — level은 두 사람 점수 중 낮은 쪽 기준(좋음·보통·주의) */
  domains?: { key: string; score1: number; score2: number; level: string; label: string }[];
  tips?: string[];
}

export async function getDailyCompat(memberId: string, p1: string, p2: string): Promise<DailyCompat> {
  return request<DailyCompat>(`/compatibility/daily?member_id=${memberId}&p1=${p1}&p2=${p2}`);
}

/** 홈 '까치 소식' 칸의 오늘 띠·절기 (specs/home §3-5, 2026-10-26) — 로그인 홈은 HomeData.today, 비로그인은 getToday() */
export interface TodayData {
  date: string;
  day_pillar: string;
  day_kor: string;
  animal: { branch: string; korean: string; emoji: string; color: string };
  zodiac: { branch: string; korean: string; emoji: string; relation: "나" | "삼합" | "육합" | "충" | "원진" | "보통"; years: string[]; advice: string }[];
  line: string;
  solar_term: { name: string; tip: string; date: string; days: number } | null;
  son_eomneun_nal: boolean;
}

export async function getToday(): Promise<TodayData> {
  return request<TodayData>("/kkachi/today");
}

/** 홈 한 장 — GET /members/{id}/home (specs/home/index.md §2-1, 2026-10-24). 기본 프로필이 없으면 me null */
export interface HomeData {
  date: string;
  me: {
    profile_id: string;
    name: string;
    character: { key: string; art_key: string; title: string; line: string };
    zodiac_branch: string;
    marks: { sinsal: string[]; sipsin: string[] };  // 가진 신살(한글)·십신(한자) — 사주 한 입 "내 사람들에게도 있을까?"
    fortune: Pick<DailyFortune, "headline" | "action" | "caution" | "total_score" | "level" | "day_element" | "solar_term" | "son_eomneun_nal" | "yongshin">;
    week: Pick<DailyFortune, "date" | "total_score" | "level" | "weather">[];  // 오늘부터 7일 — 홈 시간대·주간 시운 카드
  } | null;
  people: {
    profile_id: string;
    name: string;
    character: { key: string; art_key: string };
    marks: { sinsal: string[]; sipsin: string[] };
    compat: { score: number; level: "좋음" | "보통" | "주의"; headline: string } | null;
  }[];
  today: TodayData;
  next: ({ kind: "good_day"; date: string; action: string } | { kind: "compat"; profile_id: string; name: string } | { kind: "ai_report" })[];
}

export async function getHome(memberId: string): Promise<HomeData> {
  return request<HomeData>(`/members/${memberId}/home`);
}

/** 궁합 시운 — 오늘부터 N일(기본 14, 최대 31). 각 날은 getDailyCompat과 같은 모양. 궁합 결과 시운 탭용(2026-10-18) */
export async function getCompatForecast(memberId: string, p1: string, p2: string, days = 14): Promise<{ days: DailyCompat[] }> {
  return request<{ days: DailyCompat[] }>(`/compatibility/forecast?member_id=${memberId}&p1=${p1}&p2=${p2}&days=${days}`);
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

/** 결과 공유 카드 생성 — 서버가 카드 스냅샷을 저장하고 id를 준다. 링크는 /s/{share_id} */
export async function createShare(input: AnalysisInput, name: string): Promise<{ share_id: string }> {
  return request<{ share_id: string }>("/kkachi/shares", {
    method: "POST",
    body: JSON.stringify({ ...input, name }),
  });
}

/** 이 프로필을 기본 프로필(나)로 — 같은 회원의 다른 프로필은 해제. 목록은 다시 불러온다 */
export async function setSelfProfile(memberId: string, profileId: string): Promise<Profile> {
  return request<Profile>(`/members/${memberId}/profiles/${profileId}/set-self`, { method: "POST" });
}

/** 오늘 시운 공유 카드 — 프로필의 오늘 일진 스냅샷을 저장하고 id를 준다. 링크는 /s/{share_id} */
export async function createDailyShare(memberId: string, profileId: string): Promise<{ share_id: string }> {
  return request<{ share_id: string }>(`/members/${memberId}/profiles/${profileId}/daily/share`, { method: "POST" });
}

/** 궁합 공유 카드 — 두 사람 입력으로 계산한 결과 스냅샷을 저장하고 id를 준다. 링크는 /s/{share_id} */
export async function createCompatShare(input: CompatibilityInput): Promise<{ share_id: string }> {
  return request<{ share_id: string }>("/compatibility/shares", { method: "POST", body: JSON.stringify(input) });
}
