import { ImageResponse } from "next/og";
import { BrandOgImage, OG_SIZE, ShareOgImage, loadOgAssets } from "@/components/OgCard";
import { fetchShare } from "./share";

export const alt = "사주까치 사주 카드";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, { fonts, mascot }] = await Promise.all([fetchShare(id), loadOgAssets()]);
  return new ImageResponse(
    card ? <ShareOgImage card={card} mascot={mascot} /> : <BrandOgImage mascot={mascot} />,
    { ...OG_SIZE, fonts },
  );
}
