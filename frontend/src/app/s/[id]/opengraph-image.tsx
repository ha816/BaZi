import { ImageResponse } from "next/og";
import { BrandOgImage, CompatOgImage, DailyOgImage, OG_SIZE, ShareOgImage, loadCharacterArt, loadOgAssets } from "@/components/OgCard";
import { fetchShare } from "./share";

export const alt = "사주까치 공유 카드";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, { fonts, mascot }] = await Promise.all([fetchShare(id), loadOgAssets()]);
  // 사주 카드의 나의 캐릭터 그림(V4) — 카드마다 다르니 폰트·마스코트와 따로 읽는다
  const saju = card && card.kind !== "daily" && card.kind !== "compat" ? card : null;
  const characterArt = saju?.character ? await loadCharacterArt(saju.character.key) : null;
  return new ImageResponse(
    !card ? <BrandOgImage mascot={mascot} />
      : card.kind === "daily" ? <DailyOgImage card={card} mascot={mascot} />
      : card.kind === "compat" ? <CompatOgImage card={card} mascot={mascot} />
      : <ShareOgImage card={card} mascot={mascot} characterArt={characterArt} />,
    { ...OG_SIZE, fonts },
  );
}
