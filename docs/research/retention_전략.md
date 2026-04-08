# 사주까치 DAU·리텐션 고도화 전략

> 조사 일자: 2026-04-08  
> 목적: 오늘의 운세 기능을 축으로 DAU·D7·D30 리텐션을 끌어올릴 수 있는 전략 도출

---

## 1. 습관 형성 심리학 — 왜 매일 돌아오게 만드는가

### 1-1. Nir Eyal의 Hook 모델

운세 앱에 가장 직접 적용되는 습관 루프 이론이다.

| 단계 | Hook 모델 요소 | 사주까치 적용 |
|------|--------------|-------------|
| Trigger | 외부: 아침 푸시 알림 / 내부: "오늘 어떤 기운이지?" 불안·호기심 | 까치 캐릭터 알림 ("까치가 왔어요") |
| Action | 앱 열기 → 오늘 점수 확인 | 원터치로 점수 + 한 줄 요약 노출 |
| Variable Reward | 점수가 날마다 다름, 특별 코멘트(절기·월별 테마) | 날씨·오행 조합마다 다른 까치 멘트 |
| Investment | 프로필 저장, 친구 추가, 궁합 즐겨찾기 | 프로필 저장 = 내일 더 정확한 운세 |

**핵심 인사이트:** Variable Reward(가변 보상)는 도파민 반응을 극대화한다. 운세 점수 자체가 날마다 다르므로 이미 구조적 가변성이 존재한다. 여기에 절기 이벤트나 특별 코멘트를 섞으면 "오늘은 뭔가 다를 수도" 기대감이 생긴다.

### 1-2. 스트릭(Streak)과 손실 회피(Loss Aversion)

- 손실은 동등한 이득보다 **2배** 강하게 느껴진다 (Kahneman & Tversky).
- 7일 연속 접속 달성 사용자는 이후 일일 복귀율이 **2.3배** 상승.
- 스트릭 + 마일스톤을 함께 적용한 앱은 단일 기능 대비 **DAU 40~60% 증가**, 30일 이탈율 **35% 감소** (Forrester 2024).
- Duolingo 사례: Streak Freeze 도입 후 위험 유저 이탈율 **21% 감소**, iOS 위젯 노출 후 참여도 **60% 향상**.

**사주까치 적용 포인트:**
- "오늘의 기운" 연속 확인 N일차 배지 시스템
- 스트릭이 끊기기 직전 "내일 놓치면 X일 연속이 사라져요" 알림
- "오늘 못 봤어요" 유예권(Streak Freeze) — 유료 구독 전환 훅으로 활용 가능

---

## 2. 알림 전략 — 최적 타이밍·문구·빈도

### 2-1. 발송 시각 벤치마크

| 시간대 | 효과 | 비고 |
|-------|-----|------|
| **오전 6~8시** | 최고 CTR — 하루 시작 전 확인 | 운세 앱 최적 구간 |
| 오전 11~낮 12시 | 두 번째 피크 | 점심 전 여유 시간 |
| 오후 6~8시 | 저녁 피크 | 하루 돌아보기 심리 |
| 오후 10시~자정 | 취침 전 — 내일 예고 알림에 적합 | "내일 까치가 전할 소식" |

- 컨텍스트 맞춤 알림 개봉율: **14.4%** vs 일반 알림 **4.19%** (3.4배 차이).
- Rich Media(이미지 포함) 알림은 CTR **56% 향상**.
- 발송 시각 A/B 테스트로 반응률 **최대 40% 개선** 가능.
- 권장 빈도: **하루 1~2회** (아침 운세 + 저녁 내일 예고).

### 2-2. Co-Star가 증명한 알림 문법

Co-Star는 알림 문구를 프리랜서 작가·점성가 팀이 직접 작성한다. 핵심 원칙:

1. **짧고 뜻밖게** — 예측 가능한 "오늘의 운세입니다"를 버린다.
2. **솔직하게, 때로 불편하게** — "just make sure you're not doing that thing" 같은 무심한 문체.
3. **하루 1회 제한** — 중독적 스크롤 대신 "내일이 기다려지는" 긍정 중독 설계.
4. **스크린샷 유도** — 스크린샷 감지 시 "사주까치 태그 해주세요" 알림 자동 발송 → SNS 바이럴.

결과: 알림 문구가 **밈(meme)**이 되어 Twitter/Instagram에서 유기적 확산, 30M+ 사용자 달성.

---

## 3. 콘텐츠 다양성 — 매일 다른 느낌을 주는 방법

### 3-1. 24절기 연동 이벤트 캘린더

한국 전통 24절기는 약 15일마다 바뀌어 콘텐츠 앵커로 최적이다.

| 절기 | 날짜(기준) | 콘텐츠 테마 |
|-----|-----------|-----------|
| 입춘(立春) | 2/4 | "새 기운의 시작 — 오행 木 기운 상승" |
| 경칩(驚蟄) | 3/6 | "잠자던 기운이 깨어남 — 활동 에너지 급상승" |
| 춘분(春分) | 3/21 | "음양 균형의 날 — 궁합 특별 리포트" |
| 하지(夏至) | 6/21 | "火 기운 정점 — 강한 사주 최고의 날" |
| 동지(冬至) | 12/22 | "水 기운 — 팥죽처럼 나쁜 기운 씻어내기" |

- 절기 당일에는 모든 사용자에게 절기 특별 메시지 발송.
- 절기 관련 오행이 자신의 용신과 일치하면 "+절기 보너스 점수" 계산에 반영.
- 절기 카드(이미지) 자동 생성 → 공유 CTA.

### 3-2. 달(月)별 테마 · 보름달 이벤트

- 음력 보름(음력 15일): "달의 기운이 가장 강한 날" 특별 운세.
- 삼재(三災) 해당 사용자에게는 삼재 해소 팁 제공.
- 신월(초하루): "이번 달 전체 기운 요약" 월간 리포트 → 프리미엄 CTA.

### 3-3. 날씨 기반 오행 스토리텔링 (현재 구현 → 강화)

현재 WMO 코드 → 오행 변환이 이미 구현되어 있다. 다음 레이어를 추가한다:

- 오행 매핑에 따라 날씨별 **까치 멘트 템플릿** 5종 준비.
- "오늘 비가 와서 水 기운이 강해요 — 壬일간인 당신에게 최고의 날!" 같은 맞춤 서사.
- 폭우·폭설·폭염 등 극단 날씨에는 "특별 기상 이벤트" 배지 노출.

---

## 4. 소셜 기능 — 바이럴 루프 설계

### 4-1. 궁합 바이럴 루프 (오작교 전략)

"오작교(烏鵲橋)"라는 서비스 콘셉트를 소셜 바이럴로 연결한다.

```
사용자 A → 궁합 결과 공유 → 사용자 B 링크 클릭
→ B 가입 → A에게 "친구가 도착했어요" 알림
→ 두 사람 함께 오늘의 궁합 확인
```

Co-Star처럼 친구를 앱에서 직접 추가하고, "오늘 우리 궁합 점수"를 매일 볼 수 있는 기능은 DAU를 두 배로 늘린다.

### 4-2. 운세 카드 공유

- 점수 + 한 줄 멘트 + 날짜 + 까치 일러스트 조합의 카드 이미지 자동 생성.
- 카드 공유 시 OG 태그로 앱 설치 유도 (Deep Link).
- "오늘 점수 88점! 친구는 몇 점일까?" → 비교 욕구 자극.

### 4-3. 절기 이벤트 공유 챌린지

- "동지 팥죽 기운 챌린지" 등 시즌 이벤트를 SNS 해시태그와 연결.
- 공유 시 해당 절기 특별 분석(길흉 방위, 오행 조언) 언락.

---

## 5. 리텐션 지표 벤치마크

### 5-1. 모바일 앱 전체 업계 평균

| 지표 | 전체 앱 중앙값 | 상위 25% (Good) | 최상위 10% (Great) |
|-----|-------------|----------------|-------------------|
| D1 | 26% | 35%+ | 45%+ |
| D7 | 13% | 20%+ | 30%+ |
| D30 | 7% | 12%+ | 20%+ |

### 5-2. 라이프스타일·웰니스 앱 (운세 앱 인접 카테고리)

| 지표 | 라이프스타일 평균 | 스트릭 도입 앱 예상 |
|-----|---------------|-----------------|
| D1 | 20~27% | 30~35% |
| D7 | 7~10% | 15~20% |
| D30 | 3~5% | 8~12% |

### 5-3. 사주까치 목표 설정 (스트릭 + 절기 + 소셜 전면 도입 시)

| 지표 | 현재 추정 | 6개월 목표 | 주요 레버 |
|-----|---------|----------|---------|
| D1 | ~25% | 40% | 아침 까치 알림 최적화 |
| D7 | ~8% | 18% | 7일 스트릭 배지 + 절기 이벤트 |
| D30 | ~3% | 10% | 소셜(궁합 친구) + 월간 리포트 |
| DAU/MAU | ~10% | 25% | 스트릭 + 절기 복합 |

---

## 6. 리텐션 전략 임팩트 vs 개발 난이도 매트릭스

| 전략 | 예상 리텐션 임팩트 | 개발 난이도 | 우선순위 |
|-----|-----------------|-----------|---------|
| **아침 까치 푸시 알림 (1일 1회)** | D1 +8~12% | Low | ★★★ 즉시 |
| **오늘의 운세 스트릭 카운터 표시** | D7 +30~40% | Low | ★★★ 즉시 |
| **스트릭 N일 배지 시스템** | D30 +20% | Low-Mid | ★★★ 즉시 |
| **절기 연동 특별 메시지 (24회/년)** | DAU 스파이크 +15% | Low | ★★★ 즉시 |
| **운세 카드 이미지 생성 + 공유** | 신규 유입 바이럴 | Mid | ★★ 1~2개월 |
| **스트릭 끊기기 직전 긴급 알림** | D7 이탈 -15% | Mid | ★★ 1개월 |
| **친구 추가 + 오늘 궁합 피드** | DAU 2배 레버 | High | ★ 3개월 |
| **월간 리포트 자동 생성** | D30 +20% | Mid | ★★ 2개월 |
| **스트릭 유예권 (프리미엄 훅)** | 구독 전환 레버 | Mid | ★★ 2개월 |
| **보름달·신월 이벤트 콘텐츠** | 컨텐츠 다양성 | Low-Mid | ★★ 1개월 |
| **절기 카드 SNS 챌린지** | 신규 유입 | Mid-High | ★ 3개월 |
| **LLM 기반 개인화 멘트 생성** | 체감 품질 대폭 향상 | High | ★ 3~6개월 |

---

## 7. 알림 문구 예시 — 까치 캐릭터 활용 (10개)

까치의 특성: 솔직하고, 짧고, 약간 예측 불가하며, 친근하다.

### 아침 운세 알림 (오전 7시)

1. **기운 좋은 날**
   > 🐦 까치 왔어요!
   > "오늘 火 기운이 가득해요. 시작하기 딱 좋은 날 — 미루던 일, 오늘 해버려요."

2. **보통인 날**
   > 🐦 까치 왔어요!
   > "오늘 점수 62점. 무리하지 말고 흐름에 맡겨보세요. 까치도 오늘은 좀 쉬었어요."

3. **주의가 필요한 날**
   > 🐦 까치 왔어요!
   > "오늘은 충(衝)이 있어요. 큰 결정은 내일로. 작은 것들에 집중하는 하루로."

4. **절기 날 (입춘)**
   > 🌱 입춘 까치 왔어요!
   > "오늘부터 木 기운이 깨어나요. 새로 시작하고 싶은 게 있다면, 지금이에요."

5. **보름달 날**
   > 🌕 보름달 까치 왔어요!
   > "달이 가장 밝은 날이에요. 오늘 감사한 것 하나 떠올려보세요 — 기운이 두 배로 돌아와요."

### 저녁 내일 예고 알림 (오후 9시)

6. **내일 좋은 날 예고**
   > 🐦 까치가 내일 소식 먼저 전할게요!
   > "내일 기운이 오늘보다 훨씬 좋아요 — 내일 까치 꼭 열어봐요 👀"

7. **스트릭 독려**
   > 🔥 {N}일째 연속이에요!
   > "까치가 {N}일 동안 당신 곁에 있었어요. 내일도 함께해요 — 10일까지 얼마 안 남았어요."

### 스트릭 위기 알림

8. **스트릭 끊기기 전날**
   > ⚠️ 오늘 까치를 아직 안 열었어요!
   > "{N}일 연속이 오늘 밤 자정에 사라져요. 30초면 충분해요."

9. **스트릭 복구 유도**
   > 😔 {N}일 연속이 끊겼어요.
   > "까치도 속상해요. 오늘부터 다시 시작하면 어때요? 7일 뒤 다시 만나요."

### 소셜/바이럴 알림

10. **친구 궁합 알림**
    > 🤝 {친구 이름}님이 궁합 확인 중이에요!
    > "오작교 위에서 기다리고 있어요 — 오늘 두 분 궁합 점수 확인해보세요."

---

## 8. 즉시 실행 로드맵 (개발 난이도 Low 우선)

### Phase 1 — 2주 이내 (백엔드 없이 가능)

- [ ] **스트릭 카운터**: `localStorage["kkachi_streak"]` + 마지막 접속 날짜 저장, 프론트엔드 배지 표시
- [ ] **절기 캘린더 상수**: 24절기 날짜 하드코딩 → 당일 특별 멘트 조건 분기
- [ ] **알림 문구 템플릿 작성**: 점수대별(0~40 / 41~60 / 61~80 / 81~100) × 날씨 오행별 멘트 매트릭스

### Phase 2 — 1개월 (백엔드 포함)

- [ ] **PWA 푸시 알림**: Web Push API + 구독 테이블, 아침 7시 cron 발송
- [ ] **스트릭 DB 저장**: `daily_fortunes` 테이블 접속 날짜 기록 → 연속 일수 계산
- [ ] **운세 카드 이미지 생성**: Canvas API 또는 서버사이드 Puppeteer → OG 이미지

### Phase 3 — 3개월 (소셜 기능)

- [ ] **친구 추가 기능**: 프로필 공유 링크 → 궁합 즐겨찾기 → 오늘 궁합 피드
- [ ] **스트릭 유예권**: 프리미엄 구독(월 N원) 혜택으로 편입

---

## 9. 참고 자료

- [Streaks and Milestones for Gamification in Mobile Apps | Plotline](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps/)
- [Duolingo's Gamification Secrets: How Streaks & XP Boost Engagement by 60%](https://www.orizon.co/blog/duolingos-gamification-secrets)
- [The Psychology Behind Duolingo's Streak Feature](https://www.justanotherpm.com/blog/the-psychology-behind-duolingos-streak-feature)
- [Co-Star Astrology App: How It Works, Why Its Horoscopes Wreck Us | Inverse](https://www.inverse.com/article/54991-costar-astrology-app-how-it-works)
- [Astrology app Co-Star's bizarre push notifications are now a meme | Daily Dot](https://www.dailydot.com/unclick/co-star-astrology-app-push-notifications-memes/)
- [Co-Star Notifications | Know Your Meme](https://knowyourmeme.com/memes/co-star-notifications)
- [User Engagement in Astrology Apps — Best Practices for Retention | Vocal Media](https://vocal.media/education/user-engagement-in-astrology-apps-best-practices-for-retention)
- [Variable Rewards: Want To Hook Users? Drive Them Crazy | Nir Eyal](https://www.nirandfar.com/want-to-hook-your-users-drive-them-crazy/)
- [The Hook Model | Amplitude](https://amplitude.com/blog/the-hook-model)
- [Push Notification Open Rates & Best Practices 2025 | MobilOud](https://www.mobiloud.com/blog/push-notification-statistics)
- [App Retention Benchmarks by Industry 2025 | Plotline](https://www.plotline.so/blog/retention-rates-mobile-apps-by-industry/)
- [Why Astrology Apps Are Dominating the App Stores | Abilogic](https://articles.abilogic.com/742820/why-astrology-apps-dominating-app.html)
- [Astrology App Statistics, Insights, and Facts 2026 | Electroiq](https://electroiq.com/stats/astrology-app-statistics/)
- [What Is Co-Star? The App Using Astrology to Build Better Communities | Newsweek](https://www.newsweek.com/co-star-astrology-app-instagram-1451220)
- [24 Solar Terms: East Asian Seasonal Markers — TimeFYI](https://timefyi.com/guides/calendar-culture/24-solar-terms/)
- [리텐션을 높이는 마케팅, 어떻게 시작할 수 있을까? | AB180](https://blog.ab180.co/posts/insights-retention-marketing-start)
