import type { MetadataRoute } from "next";

// 공유 카드(/s/)는 이름이 들어가므로 검색 색인은 막고 링크 미리보기만 허용한다
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/s/", "/admin/", "/my", "/profile", "/chat", "/compatibility/chat", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
