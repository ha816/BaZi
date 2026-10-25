"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState, Suspense } from "react";
import type { AnalysisInput, AnalysisResult, Profile } from "@/types/analysis";
import { analyzeChart, analyzeProfileChart, createShare, listAnalysisYears, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import PersonCard, { type PersonState, DEFAULT_MANUAL } from "@/components/PersonCard";
import ResultSlides from "@/components/ResultSlides";
import ShareButton from "@/components/ShareButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MEMBER_ID_KEY, INPUT_CLASS, HOUR_OPTIONS } from "@/lib/constants";
import { useAiReport } from "@/lib/useAiReport";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState<string | undefined>();
  const [profileId, setProfileId] = useState<string | undefined>();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // 로그인 입력 — 궁합과 같은 카드(PersonCard): 프로필 고르기 / 직접 입력 (2026-10-25)
  const [person, setPerson] = useState<PersonState>({ mode: "manual", manual: DEFAULT_MANUAL, profileId: "" });
  const selectedProfileId = person.mode === "profile" ? person.profileId : "";
  const [profileYear, setProfileYear] = useState(new Date().getFullYear());
  // 선택한 프로필에 저장된 연도별 해석 — "지난 연도 분석 다시 보기" (ROADMAP R6)
  const [cachedYears, setCachedYears] = useState<number[]>([]);
  const [detectedCity, setDetectedCity] = useState<string | undefined>();
  const [detectedLongitude, setDetectedLongitude] = useState<number | undefined>();
  // 지금 보고 있는 결과의 입력값 — 공유 카드 생성에 그대로 보낸다
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(null);
  // AI 풀이 — 결과가 뜨자마자 미리 시작해 AI 풀이 탭에 닿을 때쯤 글이 준비되게(궁합 AI 해석과 같은 구조)
  const { text: aiText, status: aiStatus, start: startAi, reset: resetAi, retry: retryAi } = useAiReport();

  useEffect(() => {
    detectLocation().then((loc) => {
      if (loc) {
        setDetectedCity(loc.city);
        setDetectedLongitude(loc.longitude);
        setPerson((s) => (s.manual.city === DEFAULT_MANUAL.city ? { ...s, manual: { ...s.manual, city: loc.city } } : s));
      }
    });
  }, []);

  useEffect(() => {
    const mid = localStorage.getItem(MEMBER_ID_KEY) ?? undefined;
    setMemberId(mid);
    if (mid) {
      listProfiles(mid).then((ps) => {
        setProfiles(ps);
        if (ps.length > 0) {
          setPerson((s) => ({ ...s, mode: "profile", profileId: (ps.find((p) => p.is_self) ?? ps[0]).id })); // 기본 프로필(나) 우선
        }
      }).catch(() => {});
    }

    // 결과 주소(?tab=·?step= — 새로고침·뒤로 가기·홈 퀵스타트)로 왔을 때만 이전 입력으로 자동 분석.
    // 메뉴로 그냥 들어오면(/analysis) 지난 결과 대신 입력 화면부터 (2026-10-25)
    const params = new URLSearchParams(window.location.search);
    if (!params.has("tab") && !params.has("step")) return;
    const savedName = sessionStorage.getItem("kkachi_analysis_name") ?? "";
    const profileRaw = sessionStorage.getItem("kkachi_profile_input");
    const inputRaw = sessionStorage.getItem("kkachi_analysis_input");

    let profileRef: { memberId?: string; profileId?: string } = {};
    if (profileRaw) {
      try {
        const parsed = JSON.parse(profileRaw);
        if (parsed.profileId) setProfileId(parsed.profileId);
        profileRef = parsed;
      } catch { /* profileId 없이 진행 */ }
    }

    if (inputRaw) {
      let input: AnalysisInput;
      try {
        input = JSON.parse(inputRaw);
      } catch {
        return;
      }
      setName(savedName);
      setLastInput(input);
      setLoading(true);
      analyzeChart(input)
        .then((data) => {
          setResult(data);
          startAi({ input, name: savedName, memberId: profileRef.memberId, profileId: profileRef.profileId, year: input.analysis_year, cached: data.ai_report?.text });
        })
        .catch((e) => setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다."))
        .finally(() => setLoading(false));
    }
  }, [startAi]);

  useEffect(() => {
    if (!memberId || !selectedProfileId) { setCachedYears([]); return; }
    listAnalysisYears(memberId, selectedProfileId).then(setCachedYears).catch(() => setCachedYears([]));
  }, [memberId, selectedProfileId]);

  const handleDirectSubmit = async (input: AnalysisInput, n: string) => {
    setLoading(true);
    setError(null);
    try {
      sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
      sessionStorage.setItem("kkachi_analysis_name", n);
      sessionStorage.removeItem("kkachi_profile_input");
      const data = await analyzeChart(input);
      setName(n);
      setProfileId(undefined);
      setLastInput(input);
      setResult(data);
      startAi({ input, name: n, year: input.analysis_year, cached: data.ai_report?.text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const runProfileAnalysis = async (year: number) => {
    if (!memberId || !selectedProfileId) return;
    setProfileYear(year);
    setLoading(true);
    setError(null);
    try {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      const data = await analyzeProfileChart(memberId, selectedProfileId, year);
      sessionStorage.setItem("kkachi_profile_input", JSON.stringify({ memberId, profileId: selectedProfileId, year }));
      setCachedYears((ys) => (ys.includes(year) ? ys : [...ys, year].sort((a, b) => b - a)));
      let input: AnalysisInput | null = null;
      if (profile) {
        input = { birth_dt: profile.birth_dt, gender: profile.gender, analysis_year: year, city: profile.city, hour_unknown: profile.birth_hour_unknown };
        sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
        sessionStorage.setItem("kkachi_analysis_name", profile.name);
        setName(profile.name);
        setLastInput(input);
      }
      setProfileId(selectedProfileId);
      setResult(data);
      if (profile && input) {
        startAi({ input, name: profile.name, memberId, profileId: selectedProfileId, year, cached: data.ai_report?.text });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfileId) { runProfileAnalysis(profileYear); return; }
    const m = person.manual;
    const time = HOUR_OPTIONS.find((h) => h.value === m.selectedHour)?.time ?? "12:00";
    const city = m.city || detectedCity || "Seoul";
    handleDirectSubmit({
      birth_dt: `${m.birthDate}T${time}:00`,
      gender: m.gender,
      analysis_year: profileYear,
      city,
      longitude: city === detectedCity ? detectedLongitude : undefined,
      hour_unknown: m.selectedHour === "",
    }, m.name.trim());
  };
  const canSubmitMember = selectedProfileId ? true : person.mode === "manual" && !!person.manual.name.trim();

  const otherYears = cachedYears.filter((y) => y !== profileYear);

  if (result && !loading) {
    return (
      <main className="page page--center">
        <div className="page__inner">
          <PageHeader
            title="사주 분석"
            description="타고난 사주와 올해의 운세를 풀어드립니다."
            actions={
              <>
                {lastInput && (
                  // 공유 문구는 캐릭터(V4)가 주인공 — "나는 ○○". 캐릭터 없는 옛 결과는 예전 문구
                  <ShareButton
                    create={() => createShare(lastInput, name)}
                    title={result.natal.character?.title ? `${name ? `${name}님은` : "나는"} ${result.natal.character.title}` : `${name ? `${name}님` : "나"}의 사주 카드`}
                    text={result.natal.character?.title
                      ? `${name ? `${name}님은` : "나는"} '${result.natal.character.title}' — 사주까치가 뽑은 사주 캐릭터예요. 너는 어떤 캐릭터일까? 30초 만에 →`
                      : `${name ? `${name}님` : "나"}의 사주, 사주까치가 이렇게 봤어요. 나도 30초 만에 →`}
                  />
                )}
                <button
                  onClick={() => { setResult(null); setError(null); resetAi(); window.history.replaceState(null, "", "/analysis"); }}
                  className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--color-border-light)]"
                >
                  다시 입력
                </button>
              </>
            }
          />
          {profileId && otherYears.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--color-ink-faint)]">지난 연도 다시 보기</span>
              {otherYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => runProfileAnalysis(y)}
                  className="px-3 py-1 rounded-full border border-[var(--color-border-light)] text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
                >
                  {y}년
                </button>
              ))}
              <span className="px-3 py-1 rounded-full bg-[var(--color-gold-light)]/20 text-[var(--color-gold)] font-semibold">{profileYear}년 보는 중</span>
            </div>
          )}
          <Suspense fallback={<LoadingSpinner />}>
            <ResultSlides data={result} name={name} memberId={memberId} profileId={profileId} ai={{ text: aiText, status: aiStatus, onRetry: retryAi }} />
          </Suspense>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--center">
      <div className="page__inner">

        <PageHeader title="사주 분석" description="타고난 사주와 올해의 운세를 풀어드립니다." />

        {/* 로그인 — 궁합과 같은 카드 하나: [프로필 | 직접] (2026-10-25). 비로그인은 아래 직접 입력 폼 */}
        {memberId && (
          <form
            onSubmit={handleMemberSubmit}
            className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-5 space-y-4"
          >
            <PersonCard label="분석할 분" state={person} profiles={profiles}
              onChange={(patch) => setPerson((s) => ({ ...s, ...patch }))} />
            {profiles.length === 0 && (
              <p className="text-xs text-[var(--color-ink-faint)]">
                기본 프로필이 아직 없어요.{" "}
                <a href="/profile" className="text-[var(--color-gold)] underline underline-offset-2">나의 사주 등록하기 →</a>
              </p>
            )}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
              <input
                type="number"
                value={profileYear}
                onChange={(e) => setProfileYear(+e.target.value)}
                className={INPUT_CLASS}
                min={1920}
                max={2100}
              />
            </label>
            {selectedProfileId && otherYears.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--color-ink-faint)]">저장된 지난 분석</span>
                {otherYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => runProfileAnalysis(y)}
                    className="px-3 py-1 rounded-full border border-[var(--color-border-light)] text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
                  >
                    {y}년 다시 보기
                  </button>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !canSubmitMember}
              className="w-full bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-3.5 text-sm font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors"
            >
              {loading ? "분석 중..." : "분석 시작"}
            </button>
          </form>
        )}

        {/* 직접 입력 폼 — 비로그인은 항상 이것 */}
        {!memberId && (
          <AnalysisForm
            onSubmit={handleDirectSubmit}
            loading={loading}
            defaultCity={detectedCity}
            defaultLongitude={detectedLongitude}
          />
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div
            className="rounded-lg px-5 py-4 text-sm text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}
          >
            {error}
          </div>
        )}

      </div>
    </main>
  );
}
