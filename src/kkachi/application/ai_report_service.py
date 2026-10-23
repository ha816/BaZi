"""AI 풀이(분석)·AI 해석(궁합) 글의 생성과 캐시 — 컨트롤러는 스트림만 받는다.

- 프로필 분석: `analyses.result["ai_report"] = {text, version, model, created_at}` → 같은 연도를 다시 열면 즉시.
  `analyze_profile` 응답에 그대로 실려 가므로 프론트는 스트림 없이 바로 보여 줄 수 있다.
- 프로필×2 궁합: `compatibilities.result["narratives"][relation_type]` (관계 유형마다 톤이 달라 따로).
- 직접 입력: 허브 메모리(최근 64개)에만.
- 생성 중 같은 요청이 오면 `LlmStreamHub`가 한 생성을 나눠 준다. 클라이언트가 끊어도 끝까지 만들어 저장한다.
- 프롬프트가 바뀌면 `REPORT_PROMPT_VERSION`·`NARRATIVE_PROMPT_VERSION`을 올린다 → 옛 글은 버리고 다시 만든다.
- 괄호 밖에 남은 한자(간지·오행·십신·합충)는 `hanja.koreanize_stream`이 "한글(漢字)"로 바꿔 보낸다(캐시에도 바뀐 글이 저장됨).
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import UTC, datetime
from uuid import UUID

from kkachi.application.compatibility_prompt import NARRATIVE_PROMPT_VERSION
from kkachi.application.compatibility_service import CompatibilityService
from kkachi.application.hanja import koreanize_stream
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.llm_stream_hub import LlmStreamHub
from kkachi.application.port.analysis_port import AnalysisPort
from kkachi.application.port.compatibility_port import CompatibilityPort
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.report_builder import REPORT_PROMPT_VERSION, LlmReportBuilder
from kkachi.application.util.compatibility_meta import RelationType
from kkachi.domain.profile import Profile
from kkachi.domain.user import User


class LlmUnavailableError(RuntimeError):
    """LLM 포트가 없거나(테스트·설정) 꺼져 있다 — 컨트롤러가 503으로 바꾼다."""


def _user_key(user: User, name: str) -> tuple:
    return (user.birth_dt.isoformat(), user.gender.name, user.city, user.hour_unknown, name)


class AiReportService:
    def __init__(
        self,
        saju_service: KkachiService,
        compatibility_service: CompatibilityService,
        analysis_port: AnalysisPort | None = None,
        compatibility_port: CompatibilityPort | None = None,
        llm_port: LlmPort | None = None,
        hub: LlmStreamHub | None = None,
    ):
        self._saju = saju_service
        self._compat = compatibility_service
        self._analysis_port = analysis_port
        self._compat_port = compatibility_port
        self._llm_port = llm_port
        self._hub = hub or LlmStreamHub()

    # ── 공통 ──────────────────────────────────────────────────────────────
    def _llm(self) -> LlmPort:
        if self._llm_port is None or not self._llm_port.available:
            raise LlmUnavailableError("LLM 포트 없음")
        return self._llm_port

    def _entry(self, text: str, version: int) -> dict:
        return {
            "text": text,
            "version": version,
            "model": self._llm_port.model if self._llm_port else "",
            "created_at": datetime.now(UTC).isoformat(timespec="seconds"),
        }

    @staticmethod
    def _valid(entry: dict | None, version: int) -> str | None:
        if entry and entry.get("version") == version and entry.get("text"):
            return entry["text"]
        return None

    # ── 분석 AI 풀이 ──────────────────────────────────────────────────────
    async def build_analysis_report(self, user: User, name: str, year: int) -> str:
        natal, postnatal = self._saju.analyze(user, year)
        interp = await self._saju.interpret(natal, postnatal, user=user, name=name)
        return LlmReportBuilder().build(interp.natal, interp.postnatal, user, name)

    async def _produce_analysis(self, user: User, name: str, year: int) -> AsyncIterator[str]:
        llm = self._llm()
        report = await self.build_analysis_report(user, name, year)
        async for chunk in koreanize_stream(llm.stream_interpret(report, "analysis")):
            yield chunk

    async def stream_analysis(self, user: User, name: str, year: int) -> AsyncIterator[str]:
        """직접 입력 — 프로세스 메모리 캐시만."""
        key = ("analysis", year, *_user_key(user, name))
        cached = self._hub.cached(key)
        if cached is not None:
            yield cached
            return
        async for chunk in self._hub.stream(key, lambda: self._produce_analysis(user, name, year)):
            yield chunk

    async def stream_profile_analysis(self, profile: Profile, year: int) -> AsyncIterator[str]:
        """프로필 — analyses 캐시의 글을 먼저, 없으면 생성하며 끝나면 저장."""
        row = await self._analysis_port.get(profile.id, year) if self._analysis_port else None
        text = self._valid(row.result.get("ai_report") if row else None, REPORT_PROMPT_VERSION)
        if text is not None:
            yield text
            return

        user = User(
            name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt,
            city=profile.city, hour_unknown=profile.birth_hour_unknown,
        )

        async def save(done_text: str) -> None:
            if self._analysis_port is None:
                return
            fresh = await self._analysis_port.get(profile.id, year)
            if fresh is None:  # 분석 캐시가 아직 없으면(먼저 analyze를 안 거침) 저장할 자리가 없다
                return
            fresh.result["ai_report"] = self._entry(done_text, REPORT_PROMPT_VERSION)
            await self._analysis_port.save(profile.id, year, fresh.result)

        key = ("analysis-profile", profile.id, year)
        async for chunk in self._hub.stream(key, lambda: self._produce_analysis(user, profile.name, year), save):
            yield chunk

    # ── 궁합 AI 해석 ──────────────────────────────────────────────────────
    async def _produce_compat(self, user1: User, user2: User, year: int, relation_type: RelationType) -> AsyncIterator[str]:
        llm = self._llm()
        prompt = self._compat.build_narrative_prompt(user1, user2, year, relation_type)
        async for chunk in koreanize_stream(llm.stream_interpret(prompt, "compat")):
            yield chunk

    async def stream_compat(
        self, user1: User, user2: User, year: int, relation_type: RelationType,
        pair: tuple[UUID, UUID] | None = None,
    ) -> AsyncIterator[str]:
        """pair(프로필 id 둘)가 있으면 compatibilities 캐시에 저장·재사용, 없으면 메모리 캐시만."""
        produce = lambda: self._produce_compat(user1, user2, year, relation_type)  # noqa: E731
        if pair is None or self._compat_port is None:
            key = ("compat", year, relation_type, _user_key(user1, user1.name), _user_key(user2, user2.name))
            cached = self._hub.cached(key)
            if cached is not None:
                yield cached
                return
            async for chunk in self._hub.stream(key, produce):
                yield chunk
            return

        lo, hi = (pair[0], pair[1]) if str(pair[0]) < str(pair[1]) else (pair[1], pair[0])
        row = await self._compat_port.get(lo, hi, year)
        entry = (row.result.get("narratives") or {}).get(relation_type) if row else None
        text = self._valid(entry, NARRATIVE_PROMPT_VERSION)
        if text is not None:
            yield text
            return

        async def save(done_text: str) -> None:
            fresh = await self._compat_port.get(lo, hi, year)
            if fresh is None:
                return
            narratives = dict(fresh.result.get("narratives") or {})
            narratives[relation_type] = self._entry(done_text, NARRATIVE_PROMPT_VERSION)
            fresh.result["narratives"] = narratives
            await self._compat_port.update_result(lo, hi, year, fresh.result)

        key = ("compat-profile", lo, hi, year, relation_type)
        async for chunk in self._hub.stream(key, produce, save):
            yield chunk
