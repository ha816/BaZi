import asyncio

from kkachi.application.hanja import koreanize_hanja, koreanize_stream


def test_bare_ganji_element_sipsin_and_words_get_korean_with_hanja_in_parens():
    assert koreanize_hanja("올해 丙午는 겁재 해예요") == "올해 병오(丙午)는 겁재 해예요"
    assert koreanize_hanja("火 기운이 강해요") == "불(火) 기운이 강해요"
    assert koreanize_hanja("偏印의 흐름") == "편인(偏印)의 흐름"
    assert koreanize_hanja("申辰 반合") == "신진(申辰) 반합(合)"
    assert koreanize_hanja("3月에는") == "3월(月)에는"


def test_already_parenthesized_hanja_is_left_alone():
    assert koreanize_hanja("병오(丙午) 해, 겁재(劫財)") == "병오(丙午) 해, 겁재(劫財)"


def test_chinese_sentence_leak_is_cut_to_sentence_end_but_single_unknown_char_stays():
    text = "노란 소품을 착용해보는 거예요. 이举动能够立即带来运势的提升。\n\n**한 줄 총평**: 불꽃 같은 해예요."
    assert koreanize_hanja(text) == "노란 소품을 착용해보는 거예요.\n\n**한 줄 총평**: 불꽃 같은 해예요."
    assert koreanize_hanja("東 하나는 그대로") == "東 하나는 그대로"
    # 괄호 안 사주 한자는 지우기 단계에서도 보호된다
    assert koreanize_hanja("기묘(己卯) 대운 안에서 运势很好。 다음 문장.").strip() == "다음 문장."  # 샌 문장은 머리까지 통째로


def test_stream_emits_sentence_by_sentence_and_keeps_hanja_runs_whole():
    async def chunks():
        for c in ("올해 丙", "午는 겁재(劫", "財) 해예요. 다음 ", "문장이에요.\n### 제목\n", "끝"):
            yield c

    async def main():
        return [c async for c in koreanize_stream(chunks())]

    pieces = asyncio.run(main())
    assert "".join(pieces) == "올해 병오(丙午)는 겁재(劫財) 해예요. 다음 문장이에요.\n### 제목\n끝"
    assert pieces[0] == "올해 병오(丙午)는 겁재(劫財) 해예요. "  # 문장 끝에서 내보냄
