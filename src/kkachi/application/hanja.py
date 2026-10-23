"""괄호 밖 한자 정리 — LLM이 '한자는 괄호 안에만·한국어만' 규칙을 어겼을 때의 안전망.

1) 사주에서 쓰는 한자(간지 丙午·오행 火·십신 偏印·합충 낱말 合)는 "한글(漢字)"로 바꾼다. 이미 '병오(丙午)'처럼 괄호 안이면 그대로.
2) 그래도 한자가 2자 이상 남은 문장(qwen이 중국어로 새는 경우 — 예 "이举动能够立即带来运势的提升。")은 문장째 지운다.
스트림에서는 문장이 끝날 때(.!?。 뒤 공백·줄바꿈)마다 내보내 문장 단위로 처리한다(80자 넘게 쌓이면 마지막 공백까지).
"""
from __future__ import annotations

import re
from collections.abc import AsyncIterator

from kkachi.application.report_builder import SIPSIN_KOR
from kkachi.domain.ganji import Branch, Stem

_ELEMENT = {"木": "나무", "火": "불", "土": "흙", "金": "쇠", "水": "물"}
_WORDS = {
    "合": "합", "衝": "충", "沖": "충", "刑": "형", "害": "해", "破": "파", "月": "월", "年": "년", "日": "일", "時": "시",
    "大運": "대운", "歲運": "세운", "月運": "월운", "用神": "용신", "忌神": "기신", "天干合": "천간합", "天干": "천간", "地支": "지지",
    "六合": "육합", "三合": "삼합", "半合": "반합", "怨嗔": "원진", "身強": "신강", "身弱": "신약", "空亡": "공망",
    "年柱": "년주", "月柱": "월주", "日柱": "일주", "時柱": "시주", "日干": "일간", "十神": "십신", "神殺": "신살",
    "財星": "재성", "官星": "관성", "印星": "인성", "食傷": "식상", "比劫": "비겁", "三災": "삼재", "陰": "음", "陽": "양",
}
_CJK = "\u4e00-\u9fff"
_RUN = re.compile(rf"([（(]?)([{_CJK}]+)([)）]?)")
_PAREN_HANJA = re.compile(rf"\([{_CJK}]+\)")
# 한자가 2자 이상 남은 문장(앞 문장 끝·줄 처음부터 .!?。 또는 줄 끝까지)은 통째로 — 중국어로 샌 문장은 한국어 머리도 토막이라 같이 지운다
_FOREIGN_SENTENCE = re.compile(rf"(?:^|(?<=[.!?。\n]))[^\S\n]*[^\n.!?。]*[{_CJK}][^\n.!?。]*[{_CJK}][^\n.!?。]*[.!?。]?", re.M)
_SENTENCE_END = re.compile(r"[.!?。][\"”’)]*\s|\n")


def _char(ch: str) -> str | None:
    if ch in _ELEMENT:
        return _ELEMENT[ch]
    try:
        return Stem[ch].korean
    except KeyError:
        pass
    try:
        return Branch[ch].korean
    except KeyError:
        return None


def _korean(run: str) -> str | None:
    if run in _WORDS:
        return _WORDS[run]
    if run in SIPSIN_KOR:
        return SIPSIN_KOR[run]
    out = []
    for ch in run:
        k = _char(ch)
        if k is None:
            return None
        out.append(k)
    return "".join(out)


def koreanize_hanja(text: str) -> str:
    def repl(m: re.Match) -> str:
        open_, run, close = m.groups()
        if open_ and close:  # 이미 '(丙午)'처럼 괄호 안
            return m.group(0)
        kor = _korean(run)
        if kor is None:
            return m.group(0)
        return f"{open_}{kor}({run}){close}"

    text = _RUN.sub(repl, text)
    # 괄호 안 한자는 잠시 숨기고, 남은 한자 묶음(중국어 문장)은 문장 끝까지 지운다
    saved: list[str] = []

    def hide(m: re.Match) -> str:
        saved.append(m.group(0))
        return f"\x00{len(saved) - 1}\x00"

    hidden = _PAREN_HANJA.sub(hide, text)
    cleaned = _FOREIGN_SENTENCE.sub("", hidden)
    return re.sub(r"\x00(\d+)\x00", lambda m: saved[int(m.group(1))], cleaned)


async def koreanize_stream(chunks: AsyncIterator[str]) -> AsyncIterator[str]:
    """문장 단위로 내보낸다 — 문장 끝(.!?。 뒤 공백)이나 줄바꿈까지, 80자 넘게 쌓이면 마지막 공백까지."""
    pending = ""
    async for chunk in chunks:
        pending += chunk
        cut = 0
        for m in _SENTENCE_END.finditer(pending):
            cut = m.end()
        if cut == 0 and len(pending) > 80:
            cut = pending.rfind(" ") + 1
        if cut:
            yield koreanize_hanja(pending[:cut])
            pending = pending[cut:]
    if pending:
        yield koreanize_hanja(pending)
