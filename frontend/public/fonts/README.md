# OG 이미지용 한글 폰트

`app/opengraph-image.tsx`·`app/s/[id]/opengraph-image.tsx`가 satori(`next/og`)로 그릴 때 읽는다.
satori는 WOFF2를 못 읽고 CSS 폰트를 쓰지 못하므로 파일을 직접 넣는다.

- 원본: Noto Sans KR 400·700 (Google Fonts, SIL Open Font License 1.1)
- 서브셋: 한글 완성형 전체(U+AC00–D7A3)·호환 자모·라틴·문장부호·기호 + 코드(`src/kkachi`, `frontend/src`)에 등장하는 한자 242자
- 재생성: 원본 WOFF를 받은 뒤 `uv run --with fonttools pyftsubset NotoSansKR-700.woff --unicodes=U+0020-007E,U+00A0-00FF,U+2000-206F,U+2190-21FF,U+2500-25FF,U+2600-27BF,U+3000-303F,U+3131-318E,U+AC00-D7A3 --text-file=<코드에서 뽑은 한자 목록> --flavor=woff --layout-features='*' --no-hinting --desubroutinize`
- 새 한자를 백엔드 문장에 쓰면 이 서브셋에 없을 수 있다 → 재생성
- 실제 커버리지 주의(2026-10-02 cmap 확인): 위 범위를 넣었어도 원본에 없는 글리프는 빠진다 — ✦(U+2726)·✕(U+2715)·❤·✨·이모지는 **없음**, ♥ ♡ ★ ☆ ✿ ✓ ✚ ※ → · 는 있음. OG 문구는 이 안에서만
