import asyncio

import pytest

from kkachi.application.llm_stream_hub import LlmStreamHub


async def _wait_for(pred, timeout=2.0):
    for _ in range(int(timeout / 0.02)):
        if pred():
            return
        await asyncio.sleep(0.02)
    raise AssertionError("timed out")


def test_late_subscriber_shares_one_generation_and_result_is_saved_once():
    async def main():
        hub = LlmStreamHub()
        calls, saved = [], []

        async def produce():
            calls.append(1)
            for c in ("a", "b", "c"):
                await asyncio.sleep(0.02)
                yield c

        async def on_complete(text):
            saved.append(text)

        first = hub.stream("k", produce, on_complete)
        got_first = [await first.__anext__()]  # "a"가 나온 뒤에 두 번째 구독자가 붙는다
        late = [c async for c in hub.stream("k", produce, on_complete)]
        got_first += [c async for c in first]
        await _wait_for(lambda: saved)
        assert "".join(got_first) == "abc"
        assert "".join(late) == "abc" and late[0] == "a"  # 쌓인 글을 먼저 한 번에 받는다
        assert calls == [1] and saved == ["abc"]
        assert hub.cached("k") == "abc"

    asyncio.run(main())


def test_generation_finishes_and_saves_even_if_client_disconnects():
    async def main():
        hub = LlmStreamHub()
        saved = []

        async def produce():
            for c in ("a", "b", "c"):
                await asyncio.sleep(0.02)
                yield c

        async def on_complete(text):
            saved.append(text)

        agen = hub.stream("k", produce, on_complete)
        await agen.__anext__()
        await agen.aclose()  # 클라이언트가 끊음
        await _wait_for(lambda: saved)
        assert saved == ["abc"] and hub.cached("k") == "abc"

    asyncio.run(main())


def test_failure_before_first_chunk_raises_to_subscriber_and_caches_nothing():
    async def main():
        hub = LlmStreamHub()

        async def produce():
            raise RuntimeError("ollama down")
            yield ""  # 도달하지 않음 — async generator로 만들기 위한 yield

        with pytest.raises(RuntimeError):
            [c async for c in hub.stream("k", produce)]
        assert hub.cached("k") is None
        assert "k" not in hub._inflight

    asyncio.run(main())


def test_memory_cache_evicts_oldest():
    hub = LlmStreamHub(memory_cache_size=2)
    for k, v in (("a", "1"), ("b", "2"), ("c", "3")):
        hub.remember(k, v)
    assert hub.cached("a") is None and hub.cached("b") == "2" and hub.cached("c") == "3"
