import json
import logging
import os
from typing import AsyncIterator

import httpx

from kkachi.application.port.llm_port import LlmPort

_log = logging.getLogger(__name__)

_KOREAN_RULE = "반드시 한국어(한글)로만 작성하세요. 중국어·일본어·영어 단어 사용 금지 (고유명사·전문용어 제외)."
_ADVICE_SYSTEM = f"당신은 한국 사주명리 전문가입니다. 친근하고 따뜻하게, 구체적 행동 조언 중심으로 답해주세요. {_KOREAN_RULE}"
_INTERPRET_SYSTEM = f"당신은 한국 사주명리 전문가입니다. 아래 사주 데이터와 해석 가이드를 따라 통합 해석을 작성해주세요. {_KOREAN_RULE}"

_NUM_PREDICT_SHORT = 500
_NUM_PREDICT_NARRATIVE = 700
_KEEP_ALIVE = "10m"


class OllamaAdapter(LlmPort):

    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
    ):
        self._model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:32b")
        self._base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self._client = httpx.AsyncClient(timeout=180.0)

    @property
    def available(self) -> bool:
        return True  # 호출 시점에 연결 실패하면 graceful fallback

    async def _chat(self, system: str, user: str, num_predict: int = _NUM_PREDICT_SHORT) -> str:
        resp = await self._client.post(
            f"{self._base_url}/api/chat",
            json={
                "model": self._model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "stream": False,
                "keep_alive": _KEEP_ALIVE,
                "options": {"num_predict": num_predict},
            },
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()

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
        return await self._chat(_ADVICE_SYSTEM, prompt, num_predict=_NUM_PREDICT_SHORT)

    async def interpret(self, report: str) -> str:
        return await self._chat(_INTERPRET_SYSTEM, report, num_predict=_NUM_PREDICT_NARRATIVE)

    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": messages,
                    "stream": True,
                    "keep_alive": _KEEP_ALIVE,
                    "options": {"num_predict": _NUM_PREDICT_SHORT},
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if not data.get("done"):
                        yield data["message"]["content"]

    async def stream_interpret(self, report: str) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": _INTERPRET_SYSTEM},
                        {"role": "user", "content": report},
                    ],
                    "stream": True,
                    "keep_alive": _KEEP_ALIVE,
                    "options": {"num_predict": _NUM_PREDICT_NARRATIVE},
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if not data.get("done"):
                        yield data["message"]["content"]
