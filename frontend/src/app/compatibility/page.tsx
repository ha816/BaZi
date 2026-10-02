"use client";

import PageHeader from "@/components/PageHeader";
import ShareButton from "@/components/ShareButton";
import LoginRequired from "@/components/LoginRequired";
import { useStorageValue } from "@/lib/useStorageValue";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CompatibilityInput, CompatibilityResult, PersonInput, Profile, RelationType } from "@/types/analysis";
import {
  analyzeCompatibility,
  analyzeCompatibilityByProfiles,
  createCompatShare,
  getCompatInvite,
  listProfiles,
  resolveCompatInvite,
  streamCompatibilityNarrative,
} from "@/lib/api";
import { detectLocation } from "@/lib/location";
import { track } from "@/lib/track";
import CompatibilityChat from "@/components/CompatibilityChat";
import CompatibilityResultView from "@/components/CompatibilityResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import PersonCard, { type PersonState, DEFAULT_MANUAL } from "@/components/PersonCard";
import { MEMBER_ID_KEY, HOUR_OPTIONS, RELATION_TYPE_LABEL } from "@/lib/constants";
import { RELATION_GLYPH } from "@/lib/relations";

export default function CompatibilityPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompatibilityPageInner />
    </Suspense>
  );
}

function CompatibilityPageInner() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [detectedCity, setDetectedCity] = useState("Seoul");
  const [person1, setPerson1] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "male" }, profileId: "" });
  const [person2, setPerson2] = useState<PersonState>({ mode: "manual", manual: { ...DEFAULT_MANUAL, gender: "female", birthDate: "1993-01-01" }, profileId: "" });
  const [year, setYear] = useState(new Date().getFullYear());
  const [relationType, setRelationType] = useState<RelationType>("lover");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [chatInput, setChatInput] = useState<CompatibilityInput | null>(null);
  const [resultNames, setResultNames] = useState<{ name1: string; name2: string }>({ name1: "", name2: "" });
  // 오늘의 궁합(프로필×2)용 — 제출 시점에 스냅샷. person state는 ?tab= 변경마다 effect가 다시 세팅하므로 렌더 시점 값을 쓰지 않는다
  const [resultProfileIds, setResultProfileIds] = useState<{ p1: string; p2: string } | null>(null);
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const narrativeAbortRef = useRef<AbortController | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // 로그인 필수 — null=아직 모름(하이드레이션 중), ""=비로그인
  const storedMember = useStorageValue(MEMBER_ID_KEY);
  const memberId = storedMember || null;

  useEffect(() => {
    detectLocation().then((loc) => { if (loc) setDetectedCity(loc.city); });
  }, []);

  useEffect(() => {
    const id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) return;
    listProfiles(id).then((ps) => {
      setProfiles(ps);
      if (ps.length === 0) return;

      const p1Param = searchParams.get("p1");
      const p2Param = searchParams.get("p2");
      const selfP = ps.find((p) => p.is_self);

      const p1 = ps.find((p) => p.id === p1Param) ?? selfP ?? ps[0];
      const p2 =
        ps.find((p) => p.id === p2Param && p.id !== p1.id) ??
        ps.find((p) => p.id !== p1.id && !p.is_self) ??
        ps.find((p) => p.id !== p1.id);

      setPerson1((s) => ({ ...s, mode: "profile", profileId: p1.id }));
      if (p2) setPerson2((s) => ({ ...s, mode: "profile", profileId: p2.id }));
    }).catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    const inv = searchParams.get("invite");
    if (!inv) return;
    getCompatInvite(inv)
      .then((info) => {
        setInviteId(inv);
        setInviterName(info.name);
        setRelationType(info.relation_type);
        setPerson2((s) => ({ ...s, mode: "manual" }));
      })
      .catch(() => setError("초대 링크가 만료되었거나 존재하지 않습니다."));
  }, [searchParams]);

  const toPersonInput = (s: PersonState): PersonInput => {
    const hourOpt = HOUR_OPTIONS.find((h) => h.value === s.manual.selectedHour);
    return {
      name: s.manual.name || "이름 없음",
      gender: s.manual.gender,
      birth_dt: `${s.manual.birthDate}T${hourOpt?.time ?? "12:00"}:00`,
      city: s.manual.city || detectedCity,
      hour_unknown: s.manual.selectedHour === "",
    };
  };

  const getName = (s: PersonState, fallback: string) => {
    if (s.mode === "profile") {
      const p = profiles.find((x) => x.id === s.profileId);
      return p?.name ?? fallback;
    }
    return s.manual.name || fallback;
  };

  const personToInput = (s: PersonState): PersonInput => {
    if (s.mode === "profile" && s.profileId) {
      const p = profiles.find((x) => x.id === s.profileId);
      if (p) return { name: p.name, gender: p.gender, birth_dt: p.birth_dt, city: p.city, hour_unknown: p.birth_hour_unknown };
    }
    return toPersonInput(s);
  };

  // 분석 페이지의 "다시 입력"과 같은 동작 — 결과를 지우고 폼으로, ?tab= 제거
  const handleReset = () => {
    narrativeAbortRef.current?.abort();
    setResult(null);
    setChatInput(null);
    setResultProfileIds(null);
    setNarrative("");
    setNarrativeLoading(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    narrativeAbortRef.current?.abort();
    setLoading(true);
    setError(null);
    setResult(null);
    setChatInput(null);
    setResultProfileIds(null);
    setNarrative("");
    setNarrativeLoading(false);
    try {
      const input: CompatibilityInput = {
        person1: personToInput(person1),
        person2: personToInput(person2),
        year,
        relation_type: relationType,
      };
      // 초대로 들어왔으면 초대자 정보와 합쳐 resolve, 아니면 기존 경로
      const byProfiles = !inviteId && person1.mode === "profile" && person2.mode === "profile" && !!person1.profileId && !!person2.profileId;
      const data = inviteId
        ? await resolveCompatInvite(inviteId, personToInput(person2), year)
        : byProfiles
          ? await analyzeCompatibilityByProfiles(person1.profileId, person2.profileId, year, relationType)
          : await analyzeCompatibility(input);
      setResult(data);
      if (byProfiles) setResultProfileIds({ p1: person1.profileId, p2: person2.profileId });
      if (inviteId) track("compat_invite_result", { via: "invite" });
      setChatInput(input);
      const names = {
        name1: inviteId ? (inviterName || "초대한 분") : getName(person1, "첫 번째 분"),
        name2: getName(person2, "두 번째 분"),
      };
      setResultNames(names);
      sessionStorage.setItem("kkachi_compat_input", JSON.stringify(input));
      sessionStorage.setItem("kkachi_compat_names", JSON.stringify(names));

      const controller = new AbortController();
      narrativeAbortRef.current = controller;
      setNarrativeLoading(true);
      streamCompatibilityNarrative(input, setNarrative, controller.signal)
        .catch(() => {})
        .finally(() => {
          if (narrativeAbortRef.current === controller) setNarrativeLoading(false);
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    return () => { narrativeAbortRef.current?.abort(); };
  }, []);

  return (
    <main className="page page--center">
      <div className="page__inner">
        <PageHeader
          title="사주 궁합"
          description="두 사람의 사주로 인간 관계 궁합을 풀어드립니다."
          actions={
            result && !loading ? (
              <>
                {chatInput && (
                  <ShareButton
                    label="궁합 공유"
                    create={() => createCompatShare(chatInput)}
                    title={`${resultNames.name1 || "첫 번째 분"}님 ${RELATION_GLYPH[chatInput.relation_type ?? "lover"]} ${resultNames.name2 || "두 번째 분"}님 궁합`}
                    text={`${resultNames.name1 || "첫 번째 분"}님과 ${resultNames.name2 || "두 번째 분"}님 궁합 ${result.total_score}점, 사주까치가 이렇게 봤어요. 우리 궁합도 보기 →`}
                    channel="compat"
                  />
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--color-border-light)]"
                >
                  다시 입력
                </button>
              </>
            ) : undefined
          }
        />

        {storedMember === "" && (
          <LoginRequired
            message="로그인하면 사주 궁합을 볼 수 있어요"
            next={searchParams.get("invite") ? `/compatibility?invite=${searchParams.get("invite")}` : "/compatibility"}
          />
        )}
        {memberId && (
          <>
          {!result && (
            <form
              onSubmit={handleSubmit}
              className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-sm p-7 md:p-9 space-y-6"
            >
              {inviteId ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-3 text-sm text-[var(--color-ink)]">
                    💌 <strong>{inviterName || "초대한 분"}</strong>님이 궁합을 보고 싶어 해요. 아래에 내 정보만 넣으면 두 분의 궁합을 볼 수 있어요.
                  </div>
                  <PersonCard label="내 정보" state={person2} profiles={profiles}
                    onChange={(patch) => setPerson2((s) => ({ ...s, ...patch }))} />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  <PersonCard label="첫 번째 분" state={person1} profiles={profiles}
                    onChange={(patch) => setPerson1((s) => ({ ...s, ...patch }))} />
                  <div className="flex items-center justify-center flex-shrink-0 text-2xl text-[var(--color-gold-light)]">♥</div>
                  <PersonCard label="두 번째 분" state={person2} profiles={profiles}
                    onChange={(patch) => setPerson2((s) => ({ ...s, ...patch }))} />
                </div>
              )}

              <div className="space-y-1.5" hidden={!!inviteId}>
                <span className="text-sm font-medium text-[var(--color-ink-light)]">관계 유형</span>
                <div className="flex gap-2">
                  {(Object.entries(RELATION_TYPE_LABEL) as [RelationType, string][]).map(([value, label]) => {
                    const active = relationType === value;
                    return (
                      <button key={value} type="button" onClick={() => setRelationType(value)}
                        className={`flex-1 rounded-lg py-2 text-sm border transition-colors ${
                          active
                            ? "bg-[var(--color-ink)] text-[var(--color-ivory)] border-[var(--color-ink)]"
                            : "bg-white text-[var(--color-ink-muted)] border-[var(--color-border)] hover:border-[var(--color-gold-light)]"
                        }`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <label className="flex-1 space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink-light)]">분석 연도</span>
                  <input type="number" value={year} onChange={(e) => setYear(+e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm bg-white text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold-light)] focus:outline-none transition-colors" min={1920} max={2100} />
                </label>
                <button type="submit" disabled={loading}
                  className="w-full sm:flex-[2] bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg py-3 sm:py-2.5 text-base font-semibold hover:bg-[var(--color-ink-light)] disabled:bg-[var(--color-ink-faint)] transition-colors shadow-sm">
                  {loading ? "분석 중..." : "궁합 보기"}
                </button>
              </div>
            </form>
          )}

          {loading && <LoadingSpinner />}

          {error && (
            <div className="rounded-lg px-5 py-4 text-base text-[var(--color-fire)]"
              style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}>
              {error}
            </div>
          )}

          {result && !loading && (
            <>
              <CompatibilityResultView data={result}
                name1={resultNames.name1 || getName(person1, "첫 번째 분")}
                name2={resultNames.name2 || getName(person2, "두 번째 분")}
                relationType={relationType}
                memberId={memberId ?? undefined}
                profileId1={resultProfileIds?.p1}
                profileId2={resultProfileIds?.p2}
                streamingNarrative={narrative}
                narrativeLoading={narrativeLoading} />
            </>
          )}
          </>
        )}
      </div>

      {result && chatInput && !loading && <CompatibilityChat />}
    </main>
  );
}
