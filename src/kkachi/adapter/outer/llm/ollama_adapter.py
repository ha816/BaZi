import json
import logging
import os
from collections.abc import AsyncIterator

import httpx

from kkachi.application.port.llm_port import LlmPort

_log = logging.getLogger(__name__)

_KOREAN_RULE = "반드시 한국어(한글)로만 작성하세요. 중국어·일본어·영어 단어 사용 금지 (고유명사·전문용어 제외)."
_ADVICE_SYSTEM = f"당신은 한국 사주명리 전문가입니다. 친근하고 따뜻하게, 구체적 행동 조언 중심으로 답해주세요. {_KOREAN_RULE}"
# AI 풀이·궁합 AI 해석 공통 — 구조·분량·섹션은 사용자 메시지의 '쓰는 법'이 정한다(report_builder·compatibility_prompt)
_KKACHI_SYSTEM = (
    "당신은 사주 풀이 서비스 '사주까치'의 해설가 까치예요. 룰 엔진이 계산한 자료를 받아, "
    "사용자가 읽기 쉬운 한국어 이야기로 바꿔 주는 일을 해요.\n"
    "- 반드시 한국어(한글)로만 쓰고, 한자는 우리말 뒤 괄호 안에만 — 예 물(水). 중국어·일본어·영어 단어는 쓰지 않아요.\n"
    "- 자료에 없는 사실을 지어내지 않아요. 표를 쓰지 않아요. '사주에 따르면'·'자료에 따르면' 같은 말을 쓰지 않아요.\n"
    "- 자료 맨 앞 '쓰는 법'의 분량·섹션·문체를 그대로 따라요. 섹션 제목은 `### `로 시작하고, 마지막 섹션에서 끝내요(총평·맺음말 없음)."
)

# kind별 시스템 프롬프트·출력 토큰 상한 — analysis: AI 풀이(/kkachi/stream-report), compat: 궁합 AI 해석(/compatibility/narrative)
# qwen3.8은 한국어 글자당 약 0.8토큰 — analysis 1,000~1,200자+마크다운 → 1700, compat 900~1,200자 → 1600 (여유 포함)
_SYSTEM = {"analysis": _KKACHI_SYSTEM, "compat": _KKACHI_SYSTEM}
_NUM_PREDICT = {"chat": 500, "advice": 500, "analysis": 1700, "compat": 1600}
_KEEP_ALIVE = "30m"  # 탭을 오가는 동안 모델을 내리지 않게(20GB 재적재 수십 초)
_NUM_CTX = 8192  # AI 풀이 프롬프트 ≈2,900토큰 + 출력 1,700 — Ollama 기본 4096이면 앞부분이 잘린다


class OllamaAdapter(LlmPort):

    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
    ):
        self._model = model or os.getenv("OLLAMA_MODEL", "qwen3.8:27b")  # 2026-10-23 qwen2.5:32b → qwen3.8:27b (V2-3 비교)
        self._base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self._client = httpx.AsyncClient(timeout=180.0)
        self._thinking: bool | None = None  # 모델이 thinking을 지원하는지 — /api/show로 한 번만 확인


    @property
    def available(self) -> bool:
        return True  # 호출 시점에 연결 실패하면 graceful fallback

    @property
    def model(self) -> str:
        return self._model

    def _payload(self, messages: list[dict], kind: str, stream: bool, think: bool | None = None) -> dict:
        payload = {
            "model": self._model,
            "messages": messages,
            "stream": stream,
            "keep_alive": _KEEP_ALIVE,
            "options": {"num_predict": _NUM_PREDICT[kind], "num_ctx": _NUM_CTX},
        }
        if think is not None:
            payload["think"] = think  # thinking 모델(qwen3 계열)만 — 생각 토큰에 시간을 쓰지 않게 끈다
        return payload

    async def _supports_thinking(self) -> bool:
        """thinking 모델이면 True. /api/show 실패·옛 서버면 False(think 필드를 보내지 않음)."""
        if self._thinking is None:
            try:
                resp = await self._client.post(f"{self._base_url}/api/show", json={"model": self._model})
                resp.raise_for_status()
                self._thinking = "thinking" in (resp.json().get("capabilities") or [])
            except Exception:  # noqa: BLE001 — 확인 못 하면 보수적으로
                self._thinking = False
        return self._thinking

    def interpret_payload(self, report: str, kind: str = "analysis", stream: bool = True, think: bool | None = None) -> dict:
        """AI 풀이·궁합 해석 요청 본문 — 벤치 스크립트가 같은 요청으로 지연·토큰을 재도록 공개한다."""
        return self._payload(
            [{"role": "system", "content": _SYSTEM[kind]}, {"role": "user", "content": report}], kind, stream, think,
        )

    async def _chat(self, system: str, user: str, kind: str) -> str:
        resp = await self._client.post(
            f"{self._base_url}/api/chat",
            json=self._payload([{"role": "system", "content": system}, {"role": "user", "content": user}], kind, False),
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()

    async def _stream(self, payload: dict, timeout: float) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream("POST", f"{self._base_url}/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if data.get("done"):
                        if data.get("done_reason") == "length":
                            _log.warning("ollama %s: 출력이 num_predict에서 잘림 (eval_count=%s)", payload["model"], data.get("eval_count"))
                        break
                    yield data["message"]["content"]

    async def get_advice(self, params: dict) -> str:
        clashes = params.get("seun_clashes") or "없음"
        daeun_stem = params.get("daeun_stem", "")
        daeun_info = f" 현재 대운 천간은 {daeun_stem}입니다." if daeun_stem else ""

        prompt = (
            f"{params.get('name', '이 분')}에게 {params['year']}년 종합 조언을 써주세요. "
            f"225자 이내, 존댓말, 구체적 행동 포함.\n\n"
            f"- 용신: {params['yongshin']} ({params.get('yongshin_meaning', '')})\n"
            f"- 사주 특성: {params['strength_label']}\n"
            f"- 올해 용신 에너지: {'있음' if params.get('yongshin_in_seun') else '약함'}\n"
            f"- 주의할 충(衝): {clashes}{daeun_info}"
        )
        return await self._chat(_ADVICE_SYSTEM, prompt, "advice")

    async def interpret(self, report: str, kind: str = "analysis") -> str:
        return await self._chat(_SYSTEM[kind], report, kind)

    async def _think(self) -> bool | None:
        return False if await self._supports_thinking() else None

    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[str]:
        async for chunk in self._stream(self._payload(messages, "chat", True, await self._think()), timeout=120.0):
            yield chunk

    async def stream_interpret(self, report: str, kind: str = "analysis", prefix: str = "") -> AsyncIterator[str]:
        """prefix가 있으면 assistant 메시지로 넣어 모델이 그 뒤를 이어 쓰게 하고, 스트림 맨 앞에 prefix를 내보낸다."""
        payload = self.interpret_payload(report, kind, think=await self._think())
        if prefix:
            payload["messages"].append({"role": "assistant", "content": prefix})
        first = True
        async for chunk in self._stream(payload, timeout=300.0):
            if first and prefix:
                yield prefix
            first = False
            yield chunk
