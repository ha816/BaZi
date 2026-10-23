import { ImageResponse } from "next/og";
import { BrandOgImage, CompatOgImage, DailyOgImage, OG_SIZE, ShareOgImage, loadCharacterArt, loadOgAssets, loadSealArt } from "@/components/OgCard";
import { fetchShare } from "./share";

export const alt = "사주까치 공유 카드";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, { fonts, mascot }] = await Promise.all([fetchShare(id), loadOgAssets()]);
  // 캐릭터 그림 — 사주 카드는 나의 캐릭터(V4), 궁합 카드는 궁합 캐릭터 15종. 카드마다 다르니 폰트·마스코트와 따로 읽는다
  const saju = card && card.kind !== "daily" && card.kind !== "compat" ? card : null;
  const compat = card?.kind === "compat" ? card : null;
  const characterArt = saju?.character ? await loadCharacterArt(saju.character.key, saju.character.art_key) : null;
  // 궁합은 두 사람 각자의 사주 캐릭터 그림(2026-10-18) — 옛 카드엔 character_key가 없어 글자만
  const compatArts = compat?.character
    ? await Promise.all(compat.character.roles.map((r) => (r.character_key ? loadCharacterArt(r.character_key, r.art_key) : Promise.resolve(null))))
    : [];
  // 좋은 날 시운 카드는 점수 위에 운수대통 직인(2026-10-23)
  const sealArt = card?.kind === "daily" && card.level === "좋은 날" ? await loadSealArt() : null;
  return new ImageResponse(
    !card ? <BrandOgImage mascot={mascot} />
      : card.kind === "daily" ? <DailyOgImage card={card} mascot={mascot} seal={sealArt} />
      : card.kind === "compat" ? <CompatOgImage card={card} mascot={mascot} characterArts={compatArts} />
      : <ShareOgImage card={card} mascot={mascot} characterArt={characterArt} />,
    { ...OG_SIZE, fonts },
  );
}
