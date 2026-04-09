import os

from openai import AsyncOpenAI

from kkachi.application.port.llm_port import LlmPort


class LlmAdapter(LlmPort):

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self._client = AsyncOpenAI(api_key=api_key) if api_key else None

    @property
    def available(self) -> bool:
        return self._client is not None

    async def get_advice(self, params: dict) -> str:
        if not self._client:
            return ""

        clashes = params.get("seun_clashes") or "없음"
        daeun_stem = params.get("daeun_stem", "")
        daeun_info = f" 현재 대운 천간은 {daeun_stem}입니다." if daeun_stem else ""

        prompt = f"""당신은 한국 사주명리 전문가입니다.
아래 분석 데이터를 바탕으로, {params.get('name', '이 분')}에게 {params['year']}년 종합 조언을 써주세요.
친근하고 따뜻하게, 구체적 행동 조언을 포함해서 3문단으로.

- 용신(用神): {params['yongshin']} ({params.get('yongshin_meaning', '')})
- 사주 특성: {params['strength_label']}
- 올해 용신 에너지: {'있음' if params.get('yongshin_in_seun') else '약함'}
- 주의할 충(衝): {clashes}{daeun_info}

규칙:
1. "사주에 따르면" 같은 표현 금지
2. 300자 이내
3. 존댓말 사용"""

        resp = await self._client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()
