# 1909 클래식 덱 — 타로 카드 그림 78장

오늘의 카드(V9-1, 2026-11-05, `specs/tarot/index.md`)가 쓰는 그림. **1909년 영국 Rider사 출간 웨이트·스미스 덱 원판(1910 인쇄) 스캔**으로, 그림은 Pamela Colman Smith(1951 사망), 구성은 A.E. Waite(1942 사망).

## 라이선스

- 출처: Wikimedia Commons. 내려받을 때(2026-11-05) 78장 모두 API `extmetadata.LicenseShortName = "Public domain"`, `DateTimeOriginal = 1910`을 확인했다.
- 미국(1909 출간)·영국/EU(사후 70년 → 2022-01-01)·한국(2013 보호기간 연장 불소급, 1962년 이전 사망자 저작물은 만료) 모두 퍼블릭 도메인으로 본다. 법률 자문은 아니다 — 근거와 주의점은 `docs/research/tarot_타로.md` §6.
- **쓰지 않는 것**: 1971년 이후 US Games 판본의 리컬러·카드 뒷면·상자, Universal Waite(1990) — 별도 저작물. 뒷면은 그림 없이 CSS(`globals.css .tarot-card__face--back`).
- **이름**: "Rider Tarot®·Waite®·Rider-Waite Tarot®·RWS Tarot™"는 US Games 상표라 UI·설명·OG 어디에도 쓰지 않는다. 제품 문구는 **"1909 클래식 덱"**.

## 파일 — 키 = 파일명 = `domain/tarot.py` `TarotCard.key`

| 우리 키 | Commons 파일 |
|---|---|
| `major_00` ~ `major_21` | `RWS_Tarot_00_Fool.jpg` … `RWS_Tarot_21_World.jpg` (Fool · Magician · High_Priestess · Empress · Emperor · Hierophant · Lovers · Chariot · Strength · Hermit · Wheel_of_Fortune · Justice · Hanged_Man · Death · Temperance · Devil · Tower · Star · Moon · Sun · Judgement · World) |
| `wands_01` ~ `wands_14` | `Wands01.jpg` ~ `Wands14.jpg` (01 에이스 … 10, 11 시종 · 12 기사 · 13 여왕 · 14 왕) |
| `cups_01` ~ `cups_14` | `Cups01.jpg` ~ `Cups14.jpg` |
| `swords_01` ~ `swords_14` | `Swords01.jpg` ~ `Swords14.jpg` |
| `pents_01` ~ `pents_14` | `Pents01.jpg` ~ `Pents14.jpg` |

원본은 약 1,110×1,920px JPG(장당 300~600KB)라 저장소에 두지 않는다. 다시 받으려면:

```bash
# 파일 하나 — User-Agent 없이는 거절되고, 연속 호출은 끊기므로 장마다 1초 쉰다
curl -sS -L -A "kkachi/1.0 (contact: dev@local)" -o major_00.jpg \
  "https://commons.wikimedia.org/wiki/Special:FilePath/RWS_Tarot_00_Fool.jpg"
# 라이선스 메타 확인
curl -sS -A "kkachi/1.0" "https://commons.wikimedia.org/w/api.php?action=query&titles=File:RWS_Tarot_00_Fool.jpg&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=LicenseShortName|DateTimeOriginal&format=json"
```

## 변환

`scripts/art_convert.sh`는 PNG 전용에 OG용 JPG까지 만들어서(타로는 공유 카드가 없어 og/ 불필요) 쓰지 않고, ImageMagick 한 줄로 세로 800px WebP만 만든다. 결과 장당 약 90KB, 78장 7.1MB.

```bash
for f in <원본 디렉터리>/*.jpg; do k=$(basename "${f%.jpg}"); magick "$f" -resize 800x800 -quality 75 frontend/public/kkachi/tarot/"$k".webp; done
```

원판 스캔의 누런 테두리·종이 질감은 일부러 손대지 않았다(1909 원판 느낌). 역방향 표시는 그림 파일을 따로 두지 않고 CSS로 180° 돌린다.
