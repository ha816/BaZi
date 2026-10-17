#!/usr/bin/env bash
# 캐릭터 그림 변환 — 디렉터리 바로 아래 원본 PNG(Gemini 2048px) → 화면용 1024px WebP + OG용 512px JPG(og/ 아래).
#   bash scripts/art_convert.sh frontend/public/kkachi/compat          # 궁합 캐릭터 15장
#   bash scripts/art_convert.sh frontend/public/kkachi/saju_character  # 사주 캐릭터 20장(이미 변환됨 — 원본이 더 새로울 때만 다시)
# 파일명이 그대로 키가 된다(木火.png → 木火.webp, og/木火.jpg). 이미 변환된 파일이 원본보다 새로우면 건너뛴다. ImageMagick(magick) 필요.
set -euo pipefail
dir="${1:?사용법: bash scripts/art_convert.sh <그림 디렉터리>}"
command -v magick >/dev/null || { echo "magick(ImageMagick)이 필요합니다: brew install imagemagick" >&2; exit 1; }
[ -d "$dir" ] || { echo "디렉터리 없음: $dir" >&2; exit 1; }
mkdir -p "$dir/og"
n=0
for src in "$dir"/*.png; do
  [ -e "$src" ] || { echo "변환할 PNG가 없어요: $dir"; exit 0; }
  name="$(basename "${src%.png}")"
  webp="$dir/$name.webp"
  jpg="$dir/og/$name.jpg"
  if [ ! -e "$webp" ] || [ "$src" -nt "$webp" ]; then
    magick "$src" -resize 1024x1024 -quality 80 "$webp"
    echo "webp  $webp ($(du -h "$webp" | cut -f1))"
  fi
  if [ ! -e "$jpg" ] || [ "$src" -nt "$jpg" ]; then
    magick "$src" -resize 512x512 -background white -alpha remove -quality 85 "$jpg"
    echo "jpg   $jpg ($(du -h "$jpg" | cut -f1))"
  fi
  n=$((n + 1))
done
echo "완료: 원본 ${n}장 확인"
