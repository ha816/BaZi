"""LLM text/plain 스트림 응답 — 첫 조각을 먼저 받아 본 뒤 응답을 연다.

본문을 보내기 시작한 뒤에는 상태 코드를 바꿀 수 없으므로, Ollama가 꺼져 있거나 첫 조각 전에 실패하면
200 빈 본문 대신 503을 돌려준다(프론트가 "AI 서버가 켜져 있을 때 제공돼요" 안내를 띄울 수 있게).
"""
import logging
from collections.abc import AsyncIterator

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

_log = logging.getLogger(__name__)

LLM_UNAVAILABLE_DETAIL = "AI 서버(Ollama)에 연결할 수 없어요"


async def text_stream(chunks: AsyncIterator[str]) -> StreamingResponse:
    try:
        first = await chunks.__anext__()
    except StopAsyncIteration:
        raise HTTPException(status_code=503, detail=LLM_UNAVAILABLE_DETAIL)
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001 — 연결 거부·타임아웃·모델 없음 모두 503
        _log.warning("llm stream failed before first chunk: %s", e)
        raise HTTPException(status_code=503, detail=LLM_UNAVAILABLE_DETAIL)

    async def generate():
        yield first
        async for chunk in chunks:
            yield chunk

    # no-transform: 중간 프록시(Next rewrite·Caddy)가 압축·버퍼링으로 조각을 모아 보내지 않게. X-Accel-Buffering은 nginx 계열용
    headers = {"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"}
    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8", headers=headers)
