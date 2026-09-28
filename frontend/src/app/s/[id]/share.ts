import type { AnyShareCard } from "@/types/analysis";

// 서버 컴포넌트·OG 이미지에서만 부른다 — 브라우저의 /api rewrite가 아니라 백엔드로 직접 간다
const INTERNAL_API = process.env.KKACHI_API_INTERNAL_URL ?? "http://127.0.0.1:8000";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 공유 카드 조회. 카드는 불변이라 하루 캐시. 없거나 백엔드가 죽어 있으면 null */
export async function fetchShare(id: string): Promise<AnyShareCard | null> {
  if (!UUID_RE.test(id)) return null;
  try {
    const res = await fetch(`${INTERNAL_API}/kkachi/shares/${id}`, { next: { revalidate: 86400 } });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}
