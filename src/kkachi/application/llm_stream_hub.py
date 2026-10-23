"""LLM 스트림 허브 — 같은 글을 여러 요청이 나눠 받고, 다 쓰이면 저장 콜백으로 캐시한다.

- 같은 키로 생성 중이면 새 요청은 지금까지 쌓인 글을 한 번에 받고 이어서 스트림을 탄다(중복 생성 없음).
- 클라이언트가 중간에 끊어도 생성은 끝까지 가서 캐시된다 — 탭을 떠났다 돌아와도 다시 기다리지 않는다.
- 첫 조각이 나오기 전에 LLM 연결이 실패하면 구독자에게 예외를 올린다(컨트롤러가 503으로 바꾼다).
"""
from __future__ import annotations

import asyncio
import logging
from collections import OrderedDict
from collections.abc import AsyncIterator, Awaitable, Callable, Hashable

_log = logging.getLogger(__name__)

_DONE = object()


class _Job:
    def __init__(self) -> None:
        self.chunks: list[str] = []
        self.subscribers: list[asyncio.Queue] = []
        self.done = False
        self.error: BaseException | None = None

    @property
    def text(self) -> str:
        return "".join(self.chunks)


class LlmStreamHub:
    def __init__(self, memory_cache_size: int = 64):
        self._inflight: dict[Hashable, _Job] = {}
        # 프로필이 없는 직접 입력용 — 프로세스 메모리에 최근 글 몇 개만(새로고침·탭 재방문 보호)
        self._memory: OrderedDict[Hashable, str] = OrderedDict()
        self._memory_size = memory_cache_size

    def cached(self, key: Hashable) -> str | None:
        text = self._memory.get(key)
        if text is not None:
            self._memory.move_to_end(key)
        return text

    def remember(self, key: Hashable, text: str) -> None:
        self._memory[key] = text
        self._memory.move_to_end(key)
        while len(self._memory) > self._memory_size:
            self._memory.popitem(last=False)

    async def stream(
        self,
        key: Hashable,
        produce: Callable[[], AsyncIterator[str]],
        on_complete: Callable[[str], Awaitable[None]] | None = None,
    ) -> AsyncIterator[str]:
        job = self._inflight.get(key)
        if job is None:
            job = _Job()
            self._inflight[key] = job
            asyncio.create_task(self._run(key, job, produce, on_complete))

        queue: asyncio.Queue = asyncio.Queue()
        job.subscribers.append(queue)
        try:
            # 지금까지 쌓인 글을 먼저 — 구독을 등록한 뒤에 읽어야 사이에 온 조각을 놓치지 않는다
            if job.chunks:
                yield job.text
            if job.done:
                if job.error is not None and not job.chunks:
                    raise job.error
                return
            while True:
                item = await queue.get()
                if item is _DONE:
                    if job.error is not None and not job.chunks:
                        raise job.error
                    return
                yield item
        finally:
            if queue in job.subscribers:
                job.subscribers.remove(queue)

    async def _run(self, key, job: _Job, produce, on_complete) -> None:
        try:
            async for chunk in produce():
                if not chunk:
                    continue
                job.chunks.append(chunk)
                for q in list(job.subscribers):
                    q.put_nowait(chunk)
        except Exception as e:  # noqa: BLE001 — 어떤 실패든 구독자에게 전달
            job.error = e
            _log.warning("llm stream %s failed after %d chunks: %s", key, len(job.chunks), e)
        finally:
            job.done = True
            self._inflight.pop(key, None)
            for q in list(job.subscribers):
                q.put_nowait(_DONE)
        if job.error is None and job.chunks:
            text = job.text
            self.remember(key, text)
            if on_complete is not None:
                try:
                    await on_complete(text)
                except Exception as e:  # noqa: BLE001
                    _log.warning("llm stream %s save failed: %s", key, e)
