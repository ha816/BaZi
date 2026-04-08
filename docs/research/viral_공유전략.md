# 사주까치 SNS 바이럴 공유 전략 리서치

> 조사 기준일: 2026-04-08
> 목적: 사주까치 분석 결과를 SNS 공유하게 만들어 오가닉 바이럴 성장 유도

---

## 1. 운세/심리테스트 바이럴 성공 사례 분석

### 1-1. 포레스트(Forest) 앱 심리테스트 — 국내 대표 사례

포레스트는 유료 집중 앱이었으나, 직접 광고 대신 심리테스트 바이럴로 전략을 전환하여 **네이버 실검 1위 2일 연속** 달성, 이틀 동안 평소 **50배** 다운로드 기록. 이후에도 평소 5~10배 수준 유지.

**공유를 유도한 4가지 핵심 동기 (포레스트 대표 분석):**

| 동기 | 설명 |
|------|------|
| 가치관 표현 | "나는 이런 사람이야" 정체성 투영 |
| 자기 이미지 메이킹 | SNS에 올렸을 때 내가 어떻게 보일지 |
| 감정적 놀라움 | 결과가 신기하게 맞아서 공유 욕구 발생 |
| 대화 주제 | "너는 뭐 나왔어?" — 소셜 대화 촉발 |

**핵심 인사이트:** MZ세대가 결과 공유 시 "예쁘다"라는 표현을 가장 많이 사용 → **디자인이 공유 여부를 결정**함.

참고: [화제의 심리테스트! '포레스트' 대표가 말하는 바이럴 콘텐츠 기획 실전 꿀팁](https://www.careet.net/31)

---

### 1-2. 16Personalities (MBTI) — 글로벌 사례

- 전 세계 10억 명 이상 테스트 완료, 45개 언어
- 각 유형별 **캐릭터 이미지**가 밈·인포그래픽으로 SNS에 자생적 전파
- 결과 공유가 소셜 대화 진입점("너 MBTI 뭐야?")이 되어 **재방문 루프** 생성
- 공유 버튼 없이도 스크린샷으로 자발적 전파 → 비주얼 아이덴티티가 핵심

참고: [16Personalities](https://www.16personalities.com/)

---

### 1-3. 점신 — 국내 1위 운세 앱 (1,900만 명)

- 2023년 매출 830억, 2024년 목표 매출 1,300억
- **AI 관상분석**, 좋아하는 연예인과 궁합 등 타 앱에 없는 차별 콘텐츠로 SNS 화제
- 혈액형·별자리·연애타로 등 **결과가 다양해 반복 공유** 유도
- 무료 → 유료 전환 시 자연스러운 리포트 확장 구조

참고: [PM다이닝 점신 분석](https://maily.so/pmdining/posts/g1o45v56rve), [점신 공식](https://www.jeomsin.co.kr/)

---

### 1-4. 푸망(Poomang) — 심리테스트 + 사주 결합

- "사주 오행 테스트" 등 사주를 심리테스트 형식으로 재가공
- 결과 카드가 인스타그램 저장·공유 적합한 비주얼로 제작됨
- Gen-Z/Gen-Alpha 타깃, 2020년 론칭 후 급성장

참고: [푸망 사주 오행 테스트](https://poomang.com/detail/lyyjs)

---

### 1-5. 2026년 신년 운세 마케팅 트렌드 (브랜드부스트)

- "내 2026년 키워드는 OO" 형태 이미지 → 인스타그램 스토리 바이럴
- 무료 운세 → 굿즈/쿠폰 연결 → 자연스러운 전환
- 결과 화면을 인스타그램 스토리에 올리기 좋게 디자인하는 것이 핵심 전략

참고: [무료 운세 서비스와 굿즈의 결합, MZ세대가 주목하는 2026년 신년 마케팅](https://www.brandboost.kr/blog/2026-fortune-marketing-goods)

---

## 2. 공유 UX 패턴 비교표

| 서비스 | 공유 방식 | 공유 시점 | 핵심 요소 | 공유 후 CTA |
|--------|-----------|-----------|-----------|-------------|
| 포레스트 | 결과 이미지 저장 + SNS 공유 | 테스트 완료 직후 | 예쁜 결과 카드, 스터디 친구 매칭 | 앱 다운로드 |
| 16Personalities | 스크린샷 자발 공유 | 결과 확인 후 | 유형별 캐릭터 이미지 | 상세 설명 리딩 |
| 점신 | 카카오톡/SNS 공유 버튼 | 결과 하단 | 짧고 임팩트 있는 한 줄 요약 | 앱 설치 유도 |
| 푸망 | 결과 카드 저장/공유 | 테스트 종료 | 오행·심해어 등 독특한 콘셉트 | 다른 테스트 유도 |
| 사주까치(현재) | 없음 | - | - | - |

**2025년 인스타그램 알고리즘에서 "저장 & 공유"가 가장 중요한 노출 지표** → 공유 카드 제작이 곧 알고리즘 노출 증대와 직결됨.

---

## 3. 공유 이미지 설계안

### 3-1. 기술 옵션 비교

| 방식 | 장점 | 단점 | 사주까치 적합도 |
|------|------|------|----------------|
| **html-to-image** | 현재 DOM → 이미지, React 친화적, 구현 빠름 | 외부 이미지 CORS 주의, 렌더 속도 | ★★★★★ |
| **html2canvas** | 넓은 사용 사례, SVG 포함 가능 | SVG/CORS 이슈, 최근 유지보수 중단 우려 | ★★★☆☆ |
| **Next.js ImageResponse (satori)** | Edge 함수, CDN 캐시, OG 메타태그 겸용 | JSX-only, 복잡한 스타일 불가 | ★★★★☆ |
| **Canvas API 직접** | 완전 제어 | 구현 복잡도 높음 | ★★☆☆☆ |

**권장:** 공유용 카드는 `html-to-image`, OG 메타태그용 동적 이미지는 `ImageResponse(satori)` 이중 구조.

참고: [Next.js OG Image Generation](https://vercel.com/docs/og-image-generation), [Next.js에서 html2canvas/html-to-image 사용](https://velog.io/@rachel28/next-image-html2canvas-html-to-image)

---

### 3-2. 사주까치 공유 카드 레이아웃 설계안

**캔버스 크기:** 1080 × 1080px (인스타그램 정방형) / 1080 × 1920px (스토리 세로형)

```
┌─────────────────────────────────────┐
│  🪺 사주까치              [로고]   │  ← 상단 브랜딩 바 (어두운 배경)
├─────────────────────────────────────┤
│                                     │
│   ✦ 홍길동님의 사주팔자 ✦          │  ← 이름 개인화 (sessionStorage 활용)
│                                     │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐              │
│  │甲│ │乙│ │丙│ │丁│              │  ← 4기둥 천간 (한자 + 색상)
│  │子│ │丑│ │寅│ │卯│              │  ← 4기둥 지지
│  └──┘ └──┘ └──┘ └──┘              │
│  년주  월주  일주  시주             │
│                                     │
├─────────────────────────────────────┤
│  오행 분포                          │
│  木 ████░░░░  35%                   │  ← 오행 바 차트 (상위 2~3개만)
│  火 ██░░░░░░  20%                   │
│  水 ██████░░  45%                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  "水가 강한 사주,                   │  ← pillar_summary 한 줄 (핵심 메시지)
│   흐르는 물처럼 유연한 사람"        │
│                                     │
│         [까치 마스코트 이미지]      │  ← normal_kkachi_00.png
│                                     │
├─────────────────────────────────────┤
│  사주까치에서 내 사주 보기 →        │  ← URL + QR 코드 (선택)
│  kkachi.example.com                 │
└─────────────────────────────────────┘
```

**색상 전략:**
- 배경: 전통 오방색 기반 (木=청록, 火=주홍, 土=황토, 金=백금, 水=심청)
- 일간 오행 색상을 카드 전체 테마로 적용 → 개인마다 다른 색상 카드
- 어두운 그라디언트 오버레이로 텍스트 가독성 확보

**스토리 버전(세로형 1080×1920):**
- 상하 여백에 "내 오행은?" 대형 타이포
- 중앙에 까치 마스코트 + 팔자 카드
- 하단에 "친구도 확인해봐 👉 kkachi.example.com"

---

### 3-3. html-to-image 구현 스니펫 (Next.js)

```tsx
// components/ShareCard.tsx
import { toPng } from 'html-to-image';
import { useRef } from 'react';

export function ShareCard({ pillars, elementStats, name, pillarSummary }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { cacheBust: true });

    // Web Share API (모바일)
    if (navigator.share && navigator.canShare) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'saju-kkachi.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${name}님의 사주팔자` });
        return;
      }
    }
    // 폴백: 이미지 다운로드
    const link = document.createElement('a');
    link.download = 'saju-kkachi.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <>
      <div ref={cardRef} className="share-card">
        {/* 카드 콘텐츠 */}
      </div>
      <button onClick={handleShare}>이미지로 저장하기</button>
    </>
  );
}
```

참고: [Web Share API MDN](https://developer.mozilla.org/ko/docs/Web/API/Navigator/share), [html-to-image vs html2canvas 비교](https://betterprogramming.pub/heres-why-i-m-replacing-html2canvas-with-html-to-image-in-our-react-app-d8da0b85eadf)

---

### 3-4. Next.js OG 동적 이미지 (satori)

```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') ?? '홍길동';
  const element = searchParams.get('element') ?? '水';

  return new ImageResponse(
    (
      <div style={{ background: '#0a1628', width: '1200px', height: '630px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', color: 'white' }}>
        <div style={{ fontSize: 48, fontWeight: 'bold' }}>🪺 사주까치</div>
        <div style={{ fontSize: 32 }}>{name}님의 사주: {element}의 기운</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

링크 공유 시 카카오/슬랙/트위터 미리보기에 개인화 OG 이미지 노출.

참고: [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation), [Next.js 동적 OG 이미지 가이드](https://makerkit.dev/blog/tutorials/dynamic-og-image)

---

## 4. 공유 문구 패턴

### 4-1. 검증된 카피 구조

| 패턴 | 예시 | 효과 |
|------|------|------|
| **정체성 선언형** | "나는 水형 사람 — 흐르는 물처럼 적응력 甲" | 자기 이미지 투영 욕구 자극 |
| **궁금증 유발형** | "내 사주에 역마살이 있었다고???" | 놀라움 → 공유 충동 |
| **비교 유도형** | "너는 무슨 오행이야? 나는 火 4개야" | 소셜 대화 촉발 |
| **키워드 선언형** | "2026년 내 키워드: 재물운 ↑ 이동수 ↑" | 인스타 스토리 적합 |
| **마스코트 연결형** | "까치가 알려준 오늘의 기운 🪺" | 브랜드 연상 + 귀여움 |

### 4-2. 사주까치 권장 공유 템플릿

**기초 분석 (무료 결과):**
```
나의 사주 오행 분석 결과 🪺
주 오행: 水 (45%) — "깊은 물처럼 통찰력 있는 사람"

[팔자 8글자 표시]

내 사주도 궁금하다면 → kkachi.kr
#사주까치 #오행분석 #사주팔자
```

**신살 보유 시:**
```
나한테 역마살이 있었어..?? 🪺
"떠돌고 싶은 충동, 이게 다 사주 때문이었구나"

역마살 있는 사람 특: [짧은 설명]
#사주까치 #역마살 #신살
```

**오늘의 운세:**
```
오늘 [이름]님의 운세 점수: 82점 ✨
"오늘 火의 기운이 용신과 만났습니다"

#사주까치 #오늘의운세 #까치가_알려줌
```

---

## 5. 카카오톡 공유 구현

### 5-1. Kakao SDK 기본 구조

```tsx
// Kakao.Share.sendDefault() 사용
Kakao.Share.sendDefault({
  objectType: 'feed',
  content: {
    title: `${name}님의 사주팔자 — ${elementSummary}`,
    description: pillarSummary,
    imageUrl: `https://kkachi.kr/api/og?name=${name}&element=${mainElement}`,
    link: {
      mobileWebUrl: `https://kkachi.kr/analysis`,
      webUrl: `https://kkachi.kr/analysis`,
    },
  },
  buttons: [{
    title: '내 사주 보기',
    link: { mobileWebUrl: 'https://kkachi.kr', webUrl: 'https://kkachi.kr' },
  }],
});
```

**핵심:** `imageUrl`에 동적 OG 이미지 엔드포인트를 연결하면 카카오톡 미리보기에 **개인화 이미지** 표시 → CTR 대폭 향상.

### 5-2. 공유 버튼 배치 권장 위치

1. **무료 결과 하단** — "결과를 친구에게 공유해보세요" CTA 바로 위
2. **심층 분석 각 탭 우상단** — 탭별 결과 스니펫 공유
3. **오늘의 운세 카드 하단** — 매일 반복 공유 습관 형성

참고: [Kakao Developers 공식 문서](https://developers.kakao.com/docs/latest/ko/kakaotalk-share/common), [React 카카오 공유하기](https://velog.io/@bokjunwoo/wm70xwdj)

---

## 6. 공유 인센티브 전략

### 6-1. 글로벌 레퍼런스

| 서비스 | 인센티브 | 결과 |
|--------|---------|------|
| Dropbox | 친구 초대 시 저장 공간 추가 | 15개월 만에 100만 → 400만 사용자, 성장률 3,900% |
| Uber | 양방향 크레딧 지급 | 빠른 글로벌 확장의 핵심 동력 |
| Revolut | 추천인 보너스 | 150배 성장 |
| 불명 SaaS | 추천 성공 시 추가 기능 해금 | 3개월 내 신규 가입 200% 증가 |

**핵심 원칙:** 이중 보상(공유자 + 신규 유입자 모두 보상) 구조가 단방향 보상보다 2배 이상 효과적. 잘 관리된 추천 프로그램은 유료 광고 대비 CPA 30% 절감.

참고: [모바일 앱 레퍼럴 프로그램](https://adapty.io/blog/mobile-app-referral-program/), [바이럴 계수 전략](https://payproglobal.com/answers/what-is-saas-viral-coefficient/)

### 6-2. 사주까치 적용 방안

**Tier 1 — 공유 시 즉시 보상:**
- 무료 결과 이미지 공유 완료 → "심층 분석 1회 미리보기" 해금
- 카카오톡으로 친구에게 공유 → "내일 운세 +1일 무료 열람"

**Tier 2 — 친구 가입 시 양방향 보상:**
- 공유 링크로 친구가 가입 → 공유자: 심층 분석 1회 무료 / 신규 가입자: 심층 분석 1회 무료
- 추천 코드 시스템 (URL 파라미터 `?ref=XXXX`)

**Tier 3 — 소셜 증명 (SNS 공유):**
- 해시태그 `#사주까치` + 공유 인증 → 1주일 프리미엄 해금
- 인스타그램 스토리 공유 시 QR 코드 인식으로 자동 처리

---

## 7. 구현 난이도별 적용 로드맵

### Low (1~2주 구현 가능)

- [ ] **카카오톡 공유 버튼 추가** — Kakao SDK 스크립트 추가 + `sendDefault()` 호출
  - 필요 파일: `frontend/src/app/analysis/page.tsx`, `deep/page.tsx`
  - KakaoTalk AppKey `.env`에 추가
- [ ] **Web Share API 공유 버튼** — `navigator.share()` 텍스트+URL 공유
  - 결과 URL을 쿼리스트링 포함 공유 (ex. `?name=홍길동&element=水`)
- [ ] **공유 문구 자동 생성** — `pillar_summary` + `mainElement`로 한 줄 카피 생성
  - 백엔드에 `share_copy: str` 필드 추가 또는 프론트엔드에서 템플릿 조합

### Mid (2~4주 구현 가능)

- [ ] **결과 이미지 카드 생성** — `html-to-image` 라이브러리 도입
  - `ShareCard` 컴포넌트 신설 (팔자 4기둥 + 오행 바 + 마스코트)
  - "이미지 저장" 버튼 → 모바일에서 Web Share API files 공유, 데스크탑은 다운로드
- [ ] **동적 OG 이미지** — `app/api/og/route.tsx` 신설 (Next.js ImageResponse)
  - 링크 공유 시 카카오/슬랙 미리보기에 개인화 이미지 노출
- [ ] **공유 인센티브 Tier 1** — 공유 완료 이벤트 감지 → 심층 분석 미리보기 해금
  - 백엔드: `share_events` 테이블 또는 localStorage 기반 간단 처리

### High (1~2개월)

- [ ] **레퍼럴 시스템** — `?ref=` 파라미터 추적 + DB 저장 + 양방향 보상
  - 새 테이블: `referrals (id, referrer_id, referred_id, created_at, rewarded_at)`
  - 보상 지급 로직: 신규 가입 완료 후 양측 크레딧 자동 부여
- [ ] **인스타그램 스토리 최적화 카드** — 세로형(1080×1920) 별도 설계
  - "내 오행은 水" 대형 타이포 + 까치 + QR 코드
- [ ] **공유 분석 대시보드** — 어느 탭/어느 결과가 공유율 높은지 추적
  - `share_events.tab`, `share_events.channel` 컬럼으로 Interpreter 품질 측정에 연계

---

## 8. K-factor (바이럴 계수) 목표

```
K = (평균 공유 수) × (공유당 전환율)

현재: K = 0 (공유 기능 없음)
단기 목표(Low 구현 후): K = 0.3 (공유 0.5회 × 전환 60%)
중기 목표(Mid 구현 후): K = 0.7 (공유 1.2회 × 전환 58%)
장기 목표(High + 레퍼럴): K = 1.2 (공유 2.0회 × 전환 60%) → 자발적 성장
```

K > 1.0 달성 시 유료 광고 없이 사용자 수 지속 증가. 운세 앱 특성상 **신년·생일·띠해** 시즌에 K-factor가 급등하므로 이 시기 전 공유 기능 준비 필수.

---

## 참고 URL 목록

- [화제의 심리테스트! '포레스트' 대표가 말하는 바이럴 콘텐츠 기획 실전 꿀팁](https://www.careet.net/31)
- [온라인 성격 심리 테스트 마케팅 사례 총정리](https://www.mobiinside.co.kr/2021/04/30/psychological-test-marketing/)
- [무료 운세 서비스와 굿즈의 결합, MZ세대가 주목하는 2026년 신년 마케팅](https://www.brandboost.kr/blog/2026-fortune-marketing-goods)
- [Kakao Developers — 카카오톡 공유 이해하기](https://developers.kakao.com/docs/latest/ko/kakaotalk-share/common)
- [Kakao Developers — JavaScript 공유 구현](https://developers.kakao.com/docs/latest/ko/kakaotalk-share/js-link)
- [React 카카오 공유하기 구현](https://velog.io/@bokjunwoo/wm70xwdj)
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation)
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [동적 OG 이미지 생성 (Next.js 16)](https://makerkit.dev/blog/tutorials/dynamic-og-image)
- [html-to-image vs html2canvas 비교](https://betterprogramming.pub/heres-why-i-m-replacing-html2canvas-with-html-to-image-in-our-react-app-d8da0b85eadf)
- [Next.js html2canvas/html-to-image 구현](https://velog.io/@rachel28/next-image-html2canvas-html-to-image)
- [Web Share API MDN](https://developer.mozilla.org/ko/docs/Web/API/Navigator/share)
- [Web Share API + 이미지 공유](https://benkaiser.dev/sharing-images-using-the-web-share-api/)
- [모바일 앱 레퍼럴 프로그램 가이드](https://adapty.io/blog/mobile-app-referral-program/)
- [SaaS 바이럴 계수(K-factor)](https://payproglobal.com/answers/what-is-saas-viral-coefficient/)
- [모바일 앱 7가지 레퍼럴 인센티브 전략](https://onesignal.com/blog/7-strategies-to-incentivize-app-referrals/)
- [푸망 사주 오행 테스트](https://poomang.com/detail/lyyjs)
- [점신 공식 사이트](https://www.jeomsin.co.kr/)
- [포스텔러 Instagram](https://www.instagram.com/forceteller_official/)
