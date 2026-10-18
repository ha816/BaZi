# 화면용 한글 폰트 (next/font/local)

`app/layout.tsx`가 `next/font/local`로 읽는다. 빌드·개발 서버가 구글 폰트를 받지 않으므로 네트워크가 느려도 컴파일이 깨지지 않는다
(2026-10-18 — `fonts.gstatic.com` 조각 하나가 타임아웃되면 Turbopack이 대체 폰트로 넘어가지 않고 "Module not found: @vercel/turbopack-next/internal/font/google/font"로 멈추던 문제).
OG 이미지용 폰트는 `public/fonts/`(satori는 WOFF만 읽음)에 따로 있다.

| 파일 | 원본 | 굵기 | 크기 |
|---|---|---|---|
| `NotoSansKR-VF.woff2` | Noto Sans KR 가변(`NotoSansKR[wght].ttf`, google/fonts `ofl/notosanskr`) | wght 100–900 한 파일 (화면은 300~700 사용) | 약 400KB |
| `NotoSerifKR-VF.woff2` | Noto Serif KR 가변(`NotoSerifKR[wght].ttf`, google/fonts `ofl/notoserifkr`) | wght 200–900 한 파일 (화면은 400~700 사용) | 약 735KB |
| `OFL.txt` | SIL Open Font License 1.1 | | |

## 서브셋 범위

- 한글: **KS X 1001 상용 2,350자** + 코드(`frontend/src`, `src/kkachi`)에 실제로 쓰인 음절. 전체 11,172자를 넣으면 Sans 1.1MB·Serif 1.85MB라 상용으로 줄였다 — 상용 밖 음절(드문 이름 글자 등)은 `fallback`의 시스템 한글 폰트로 떨어진다
- 한자: 코드에 등장하는 247자(천간·지지·오행·신살·십신 등). **백엔드 문장에 새 한자를 쓰면 재생성**
- 호환 자모(ㄱ ㅏ …), 라틴·Latin-1, 구두점(– — … ※), 화살표, 원문자(①), 도형(▲ ○ ●), 기호(★ ♥ ✓ ✗), CJK 구두점, 전각 기호
- 굵기 축은 자르지 않았다 — 두 폰트 모두 마스터가 2개라 300~700으로 잘라도 작아지지 않는다(확인함)

## 재생성

원본 TTF는 저장소에 두지 않는다(각 10MB·24MB).

```bash
# 1) 원본 (google/fonts 저장소, OFL)
curl -sL -o NotoSansKR-VF.ttf  "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
curl -sL -o NotoSerifKR-VF.ttf "https://github.com/google/fonts/raw/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf"

# 2) 유니코드 목록 — 아래 고정 범위 + KS X 1001 한글 2,350자(cp949에서 B0A1~C8FE에 떨어지는 음절) + 코드에 쓰인 한자·기호·음절
#    고정 범위: U+0020-007E, U+00A0-00FF, U+2000-206F, U+20A0-20CF, U+2190-21FF, U+2200-22FF, U+2460-24FF,
#              U+2500-259F, U+25A0-25FF, U+2600-27BF, U+2B00-2BFF, U+3000-303F, U+3131-318E, U+FF01-FF60

# 3) 서브셋 (fonttools·brotli는 프로젝트 의존성이 아니라 --with로)
uv run --with fonttools --with brotli pyftsubset NotoSansKR-VF.ttf --unicodes-file=unicodes.txt --flavor=woff2 \
  --no-hinting --desubroutinize --notdef-outline --name-IDs=0,1,2,3,4,6,13,14 --drop-tables+=DSIG \
  --output-file=frontend/src/app/fonts/NotoSansKR-VF.woff2
# Serif도 같은 명령으로
```

`layout.tsx`의 `weight: "300 700"`·`"400 700"`은 CSS `font-weight` 범위 선언이다. 굵기를 더 쓰려면 그 범위만 넓히면 된다(파일은 100~900을 다 담고 있다).
