import { ImageResponse } from "next/og";
import { BrandOgImage, CompatOgImage, DailyOgImage, OG_SIZE, ShareOgImage, loadOgAssets } from "@/components/OgCard";
import { fetchShare } from "./share";

export const alt = "사주까치 공유 카드";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, { fonts, mascot }] = await Promise.all([fetchShare(id), loadOgAssets()]);
  return new ImageResponse(
    !card ? <BrandOgImage mascot={mascot} />
      : card.kind === "daily" ? <DailyOgImage card={card} mascot={mascot} />
      : card.kind === "compat" ? <CompatOgImage card={card} mascot={mascot} />
      : <ShareOgImage card={card} mascot={mascot} />,
    { ...OG_SIZE, fonts },
  );
}
