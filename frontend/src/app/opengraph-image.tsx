import { ImageResponse } from "next/og";
import { BrandOgImage, OG_SIZE, loadOgAssets } from "@/components/OgCard";

export const alt = "사주까치 — 30초 만에 내 사주 보기";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const { fonts, mascot } = await loadOgAssets();
  return new ImageResponse(<BrandOgImage mascot={mascot} />, { ...OG_SIZE, fonts });
}
