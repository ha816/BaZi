# LLM 하이브리드 해석 엔진 전략

> 작성일: 2026-04-08  
> 목적: Rule 엔진(9개 Interpreter)이 생성한 구조화 데이터를 LLM이 자연어로 변환하는 하이브리드 아키텍처 구축 전략

---

## 1. 핵심 원칙: LLM은 "언어 변환기"

사주까치가 채택해야 할 접근 방식은 학술적으로도 검증된 **Serial Hybrid 아키텍처**다.

```
Rule 엔진 (Interpreter) → 구조화 데이터 (JSON) → LLM → 자연어 해석문
```

이 접근이 중요한 이유:

1. **환각(Hallucination) 방지**: 일반 LLM에 BaZi 계산을 맡기면 간지·십신을 오계산한다. 중국의 Cantian AI(参天AI)가 MCP Server 아키텍처를 통해 이를 해결한 방식이 정확히 이것이다 — 결정론적 계산 엔진은 Rule 엔진이, 자연어는 LLM이 담당. (출처: [BaZi MCP Server 심층 분석](https://skywork.ai/skypage/en/bazi-ai-engineer-code/1981206600771096576))
2. **2025년 연구 결론**: 동일 LLM을 직접 프롬프팅하는 것보다 Rule 엔진 출력을 컨텍스트로 주입했을 때 환각이 줄고 품질이 높다는 것이 실증됨. (출처: [LLMs for Building Interpretable Rule-Based Data-to-Text](https://arxiv.org/html/2502.20609v1))

---

## 2. 프롬프트 패턴 Best Practice

### 2-1. System Prompt — 페르소나 + 도메인 컨텍스트

```
당신은 20년 경력의 한국 명리학(命理學) 상담사입니다.
제공되는 데이터는 Rule 기반 엔진이 정확하게 계산한 사주 분석 결과입니다.
이 데이터를 절대 수정하거나 추가 계산하지 말고, 오직 30대 한국인이 공감할 수 있는
따뜻하고 구체적인 언어로 변환하는 역할만 수행하십시오.

출력 규칙:
- 존댓말, 2인칭("당신"→"{name}님")
- 문장 당 40~60자, 단락 2~3문장
- 사주 전문 용어 사용 시 반드시 괄호로 쉬운 말 병기 (예: 정재(正財 — 안정적 수입))
- 점성술 예언 투 금지, 조언/통찰 투로
```

**핵심**: 페르소나 설정이 출력 품질을 일관되게 높인다는 것은 Role Prompting 연구에서 반복 확인됨. (출처: [Role Prompting Guide](https://learnprompting.org/docs/advanced/zero_shot/role_prompting))

### 2-2. User Message — 구조화 데이터 주입 + 변환 지시

```
## 분석 대상
이름: {name}
성별: {gender}
사주팔자: {pillars}
일간(나의 핵심 기운): {day_stem} ({day_stem_meaning})

## Rule 엔진 분석 결과 (변환 대상)
```json
{
  "domain": "성격분석",
  "raw_blocks": [
    "당신은 봄날의 큰 나무처럼 위로 뻗어가는 에너지를 가진 사람입니다. 木(목)의 성향.",
    "여기에 '절정의 에너지'의 운성이 더해져 삶의 기본 리듬을 형성합니다.",
    "특히 역마살이 있어 변화와 이동을 좋아하는 성향이 두드러집니다."
  ],
  "supporting_data": {
    "my_element": "木",
    "strength": "+3 (신강)",
    "sinsal": ["역마살"],
    "sibi_unseong_day": "건록"
  }
}
```

위 Rule 엔진 출력을 {name}님 개인에게 말을 거는 방식으로 자연스럽게 풀어써 주세요.
각 블록을 하나의 흐름이 있는 2~3문단으로 통합하고,
비유와 현실 적용 예시(직장, 관계, 라이프스타일)를 1개 이상 추가하세요.
```

### 2-3. Chain-of-Thought (CoT) 적용 — 복잡한 도메인에만

연간 운세(SeunInterpreter) + 종합 조언(AdviceInterpreter) 같이 여러 데이터가 교차하는 경우:

```
[내부 추론 단계 — 출력하지 말 것]
1. 세운(올해 운)과 대운(10년 흐름)에 용신이 있는지 확인
2. 충·합 여부 확인
3. 이 3가지 요소의 조합이 의미하는 핵심 메시지 1줄 추출

[출력]
위 추론을 바탕으로 {name}님께 드리는 {year}년 종합 조언을 작성하세요.
```

2025년 Focused CoT 연구에 따르면, 복잡한 추론이 필요한 태스크에 CoT를 적용하되 단순 변환에는 생략하는 것이 토큰 효율성을 크게 높인다. (출처: [Focused CoT](https://arxiv.org/html/2511.22176v1))

### 2-4. Few-Shot 예시 — 선택적 적용

품질이 가장 까다로운 **AdviceInterpreter**(종합 조언) 1개 도메인에 Few-Shot 예시 1쌍 포함 권장:

```
## 예시 (Few-Shot)
[Rule 엔진 입력]
yongshin_in_seun: true, yongshin_in_daeun: true, has_clash: false

[좋은 출력 예시]
"2025년은 김지수님에게 바람이 돛을 가득 채운 항해의 해입니다.
 올해 운(세운)과 10년의 큰 흐름(대운) 모두에서 나에게 유리한 기운이 작용하고,
 부딪히는 에너지도 없어 마치 순풍 속에 돛을 올린 배처럼 앞으로 나아가기 좋습니다.
 새 사업, 이직, 투자처럼 평소 망설였던 결정을 실행에 옮기기에 최적의 시기입니다."

## 실제 입력
{실제 데이터 JSON}
```

---

## 3. 품질 평가 기준

### 3-1. "공감도" 측정 방법 (BLEU/ROUGE 대신)

BLEU/ROUGE는 표면 문자열 유사도만 측정하므로 공감·개인화 품질에 부적합하다. 2025년 NLG 평가 트렌드에서 대체 접근:

| 평가 방법 | 설명 | 사주까치 적용 |
|-----------|------|---------------|
| **LLM-as-Judge (G-Eval)** | GPT-4/Claude가 루브릭 기준으로 점수 매김 | 내부 테스트 자동화에 사용 |
| **Empathy 점수** | "이 글이 나에 대한 이야기처럼 느껴집니까?" 5점 척도 | 사용자 피드백 버튼에 반영 |
| **Personalization 점수** | 이름, 상황, 오행 정보가 구체적으로 녹아들었는지 | 내부 품질 게이팅 |
| **Appropriateness** | 문화적으로 적절하고 해롭지 않은지 | 출시 전 검수 |

(출처: [NLG Evaluation 2025 vs 2015](https://ehudreiter.com/2025/02/04/nlg-evaluation-2025-vs-2015/), [G-Eval 논문](https://www.researchgate.net/publication/376393580_G-Eval_NLG_Evaluation_using_Gpt-4_with_Better_Human_Alignment))

### 3-2. 운영 중 피드백 지표

```
해석 하단 버튼:
  👍 "딱 내 얘기예요"  → DB: feedback=positive
  👎 "잘 모르겠어요"   → DB: feedback=negative
  
집계 쿼리:
  SELECT interpreter_name, 
         SUM(CASE WHEN feedback='positive' THEN 1 END) / COUNT(*) AS satisfaction_rate
  FROM interpretations
  GROUP BY interpreter_name
  ORDER BY satisfaction_rate ASC;
  → 만족도 낮은 Interpreter부터 LLM 변환 우선 적용
```

---

## 4. 비용·레이턴시 트레이드오프

### 4-1. 모델 비교표

| 모델 | Input ($/1M) | Output ($/1M) | 레이턴시 | 한국어 품질 | 권장 용도 |
|------|-------------|---------------|---------|------------|-----------|
| **Claude Haiku 4.5** | $1.00 | $5.00 | ~200ms | 우수 | 일일 운세, 짧은 블록 변환 |
| **Claude Haiku 3.5** | $0.80 | $4.00 | ~250ms | 우수 | 비용 최적화 배치 |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | ~800ms | 최우수 | 심층 분석 최초 생성 |
| **GPT-4o-mini** | $0.15 | $0.60 | ~300ms | 양호 | 비용 최저, 보조 모델 |
| **Gemini 2.0 Flash** | $0.10 | $0.40 | ~300ms | 양호 | 초저가 대량 처리 |

(출처: [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [LLM API Pricing Comparison](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025), [GPT-4o-mini Pricing](https://openai.com/api/pricing/))

### 4-2. 사주까치 추천 조합

**티어 1 — MVP 검증 단계** (비용 최소화):
- 모델: `Claude Haiku 4.5`
- 월 예상 요청: 1,000건 × 9개 Interpreter = 9,000 LLM 호출
- 추정 비용: 블록당 ~500 input + ~300 output 토큰 → **월 ~$5.4** (충분히 저렴)

**티어 2 — 품질 차별화 단계**:
- 일반 블록: `Haiku 4.5` (저비용)
- 종합 조언(AdviceInterpreter) + 연간 운세(SeunInterpreter): `Sonnet 4.6` (고품질)
- 비용 증가: 월 2개 Interpreter × 9,000건 × Sonnet 단가 → **월 ~$40 추가**

### 4-3. Prompt Caching 전략 (필수)

Claude의 Prompt Caching을 활용하면 비용 90%·레이턴시 85% 절감 가능.

```
캐싱 대상 (변경 빈도 낮음):
  - System Prompt (페르소나, 출력 규칙)
  - OHENG_METAPHOR, SIPSIN_DETAIL 등 도메인 사전 (약 2,000 토큰)
  - Few-Shot 예시

캐싱 제외 (요청마다 다름):
  - 사용자 이름, 생년월일
  - Rule 엔진 출력 JSON

구현:
  cache_control={"type": "ephemeral"}  # 5분 캐시, 1.25x 쓰기 / 0.1x 읽기
  → 두 번째 요청부터 캐시 히트 = 비용 90% 절감
```

(출처: [Prompt Caching - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [60% Cost Reduction Case](https://medium.com/tr-labs-ml-engineering-blog/prompt-caching-the-secret-to-60-cost-reduction-in-llm-applications-6c792a0ac29b))

### 4-4. DB 캐싱 (기존 analyses 테이블 활용)

```python
# 이미 analyses 테이블에 (profile_id, year) 유니크 키 존재
# LLM 변환 결과도 analyses.result JSONB에 함께 저장
# → 동일 profile × 동일 year 재요청 시 LLM 호출 없음
```

---

## 5. 실제 구현 사례 분석

### 5-1. Cantian AI (参天AI) — BaZi MCP Server

- **아키텍처**: 결정론적 BaZi 계산 엔진(MCP Server) + Claude/GPT 자연어 변환
- **핵심 교훈**: "LLM에게 계산을 시키지 말고, 계산 결과를 먹여라" → 정확도 100%
- **성과**: GPT Store에서 가장 인기 있는 BaZi 관련 GPT로 성장
- (출처: [GitHub cantian-ai/bazi-mcp](https://github.com/cantian-ai/bazi-mcp))

### 5-2. BaziAI.com — DeepSeek R1 통합

- **아키텍처**: 전통 계산 + DeepSeek R1(논리 추론 특화) 조합
- **특이점**: 여러 LLM(ChatGPT, Claude, Gemini)을 앙상블로 사용
- **시장 트렌드**: 중국 Gen Z를 중심으로 AI 운세 시장 급성장, DeepSeek 서버가 춘절에 다운될 정도
- (출처: [MIT Technology Review - DeepSeek 운세](https://www.technologyreview.com/2025/03/03/1112604/deepseek-fortune-teller-china/))

### 5-3. Astrology API.io — 10배 빠른 해석

- **접근**: 행성 데이터(rule) → LLM 자연어 변환, 해석 시간 10배 단축
- **교훈**: LLM 변환은 속도와 스케일 모두 향상
- (출처: [AI-Powered Astrology](https://astrology-api.io/blog/ai-powered-astrology-machine-learning-revolutionizing-chart-interpretation))

---

## 6. 사주까치 적용 우선순위

### 6-1. Interpreter별 LLM 적용 임팩트 분석

| Interpreter | 현재 패턴 | LLM 임팩트 | 복잡도 | 우선순위 |
|-------------|-----------|-----------|--------|---------|
| **AdviceInterpreter** | 5가지 시나리오 분기 → 템플릿 문장 | 🔴 최고 | 낮음 | **1위** |
| **PersonalityInterpreter** | 오행 + 신살 → 나열 | 🔴 높음 | 낮음 | **2위** |
| **YongshinInterpreter** | 4가지 분기 → 비유 문장 | 🟠 높음 | 낮음 | **3위** |
| **FortuneInterpreter** | 십신별 SIPSIN_DETAIL → 도메인 | 🟠 중간 | 낮음 | **4위** |
| **SeunInterpreter** | 2줄 단순 출력 | 🟡 중간 | 낮음 | **5위** |
| **RelationshipInterpreter** | 충·합 조합 나열 | 🟡 중간 | 낮음 | **6위** |
| **DaeunInterpreter** | 대운 기간 + 십신 tips | 🟢 낮음 | 낮음 | **7위** |
| **ElementBalanceInterpreter** | 과다/부족 오행 나열 | 🟢 낮음 | 중간 | **8위** |
| **SamjaeInterpreter** | 삼재 유무 조건 분기 | 🟢 낮음 | 낮음 | **9위** |

### 6-2. 1위: AdviceInterpreter — 즉시 시작 이유

**현재 문제**: 5가지 분기 조건으로 고정 문장이 출력됨. 사용자가 "내 얘기가 아닌 것 같다"고 느끼는 주요 원인.

**LLM 변환 시 기대 효과**:
- 이름 개인화: "바람이 돛을 가득 채운 배" → "민지님, 2026년은 3년 준비한 당신의 계획이 드디어 탄력받는 해입니다"
- 구체성: 추상적 조언 → 직장인/창업자/취준생 맥락 반영 가능
- 개운법(YONGSHIN_FORTUNE) 5개 tip을 자연스럽게 통합

**2위: PersonalityInterpreter — 첫 인상이 전체 공감도 결정**

사용자가 앱을 열고 가장 먼저 보는 해석. "와, 딱 내 얘기네!" 반응이 여기서 결정됨. 현재 나열식 구조를 LLM이 서사로 엮어주면 임팩트 최대.

### 6-3. 단계별 롤아웃 계획

```
Phase 1 (MVP, 2주):
  - AdviceInterpreter에만 LLM 적용 (Haiku 4.5)
  - A/B 테스트: LLM 버전 vs Rule 버전 노출 50:50
  - 피드백 버튼 집계로 공감도 비교

Phase 2 (4주):
  - PersonalityInterpreter + YongshinInterpreter 추가
  - 만족도 낮은 순서대로 확장

Phase 3 (8주):
  - 전체 9개 Interpreter LLM 변환
  - Sonnet 4.6 고품질 변환: Advice + Seun
  - Haiku 4.5: 나머지 7개
```

---

## 7. 프롬프트 템플릿 초안 (즉시 사용 가능)

### 7-1. AdviceInterpreter 프롬프트

```python
ADVICE_SYSTEM_PROMPT = """
당신은 20년 경력의 한국 명리학 상담사입니다.
제공되는 JSON은 Rule 기반 사주 계산 엔진의 정확한 분석 결과입니다.
이 데이터를 사용자에게 공감 가는 언어로 변환하는 역할만 수행하세요.

출력 규칙:
- "{name}님"으로 직접 말 걸기
- 예언 투 금지, 조언/통찰 투 사용 ("~합니다" 대신 "~해 보세요", "~할 수 있어요")
- 구체적 행동 제안 1개 이상 포함
- 전체 200~300자
- 개운법은 자연스럽게 마지막 문단에 녹이기
"""

ADVICE_USER_PROMPT = """
## 사용자 정보
이름: {name}
올해 분석 연도: {year}
일간(핵심 기운): {day_stem_meaning}

## Rule 엔진 결과
```json
{
  "scenario": "{scenario_key}",
  "yongshin": "{yongshin_meaning}",
  "yongshin_in_seun": {yongshin_in_seun},
  "yongshin_in_daeun": {yongshin_in_daeun},
  "has_clash": {has_clash},
  "has_combine": {has_combine},
  "gaegeunyup": {
    "activity": "{activity}",
    "color": "{color}",
    "direction": "{direction}",
    "food": "{food}",
    "investment": "{investment}"
  }
}
```

위 데이터를 {name}님께 드리는 {year}년 종합 조언으로 변환하세요.
"""
```

### 7-2. PersonalityInterpreter 프롬프트

```python
PERSONALITY_SYSTEM_PROMPT = """
당신은 친근하고 통찰력 있는 사주 상담사입니다.
Rule 엔진이 계산한 오행·신살 데이터를 받아 사용자가 "딱 내 얘기다!"라고
느낄 만한 성격 분석 텍스트로 변환합니다.

규칙:
- 강점 → 구체적 상황 예시 포함 (직장, 인간관계, 창작)
- 약점 → 리프레이밍 (문제점이 아닌 "다른 관점에서 보면")
- {name}님 직접 호칭, 100~150자 per 문단
"""

PERSONALITY_USER_PROMPT = """
## 사용자
이름: {name}

## Rule 엔진 성격 분석 블록
{rule_engine_blocks_json}

## 지원 데이터
- 주 오행: {my_element_meaning} ({my_element_name})
- 오행 강약: {strength_label}
- 십이운성(일주): {day_unseong}
- 신살: {sinsal_list}

이 데이터를 바탕으로 {name}님의 성격을 3문단으로 서술해 주세요.
"""
```

---

## 8. 구현 시 주의사항

### 8-1. 도메인 지식 유실 방지

LLM이 사주 전문 용어를 임의로 변형하지 않도록:
```
절대 수정 금지 목록을 시스템 프롬프트에 명시:
  "십신명(食神, 傷官, 偏財 등), 오행명(木火土金水), 
   간지(甲乙丙丁...), 용신 판단은 제공된 데이터 그대로만 사용하세요."
```

### 8-2. Temperature 설정

```python
# 성격/조언 (창의성 필요): temperature=0.7
# 연간 운세/대운 (일관성 필요): temperature=0.3
# 개운법 tip (정확성 필요): temperature=0.1
```

### 8-3. 출력 길이 제어

```python
max_tokens = {
    "advice": 300,      # 종합 조언
    "personality": 250, # 성격 분석
    "fortune": 150,     # 도메인별 운세
    "yongshin": 200,    # 용신 설명
}
```

---

## 9. 참고 자료

- [Strengths and Weaknesses of LLM-Based and Rule-Based NLP — MDPI 2025](https://www.mdpi.com/2079-9292/14/15/3064)
- [LLMs for Building Interpretable Rule-Based Data-to-Text — arXiv 2025](https://arxiv.org/html/2502.20609v1)
- [Focused Chain-of-Thought — arXiv 2025](https://arxiv.org/html/2511.22176v1)
- [Anthropic Claude Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude Prompt Caching 공식 문서](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Prompt Caching — 60% 비용 절감 사례 (Thomson Reuters)](https://medium.com/tr-labs-ml-engineering-blog/prompt-caching-the-secret-to-60-cost-reduction-in-llm-applications-6c792a0ac29b)
- [LLM API Pricing Comparison 2025 — IntuitionLabs](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [BaZi MCP Server 심층 분석 — Skywork AI](https://skywork.ai/skypage/en/bazi-ai-engineer-code/1981206600771096576)
- [DeepSeek 운세 붐 — MIT Technology Review](https://www.technologyreview.com/2025/03/03/1112604/deepseek-fortune-teller-china/)
- [NLG Evaluation 2025 — Ehud Reiter](https://ehudreiter.com/2025/02/04/nlg-evaluation-2025-vs-2015/)
- [G-Eval: NLG Evaluation using GPT-4](https://www.researchgate.net/publication/376393580_G-Eval_NLG_Evaluation_using_Gpt-4_with_Better_Human_Alignment)
- [AI Astrology App Development — OmiSoft](https://ai.omisoft.net/ai-astrology-app-development-predict-your-success/)
- [Cantian AI BaZi MCP GitHub](https://github.com/cantian-ai/bazi-mcp)
