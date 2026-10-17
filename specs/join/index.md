# 회원가입 / 로그인

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/join` — 이메일 식별, 2단계(내 사주 등록) |

## 화면 명세 (옛 screen_spec)

```
Step 1: 이름 + 이메일 → POST /members (기존 이메일이면 기존 멤버 반환)
  → listProfiles → 있으면 /   없으면 Step 2
Step 2: 이름(pre-fill)·생년월일·시간·성별·도시(ipapi 자동) → POST /profiles (is_self: true) → /
```

**개선 포인트:** 이미 로그인된 상태에서 진입 시 redirect 없음. Step 2 폼은 `ProfileForm`과 별도 인라인 구현.

---
