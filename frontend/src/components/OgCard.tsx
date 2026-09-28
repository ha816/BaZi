import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CompatShareCard, DailyShareCard, ShareCard } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";

// 링크 미리보기(OG) 이미지 — satori(next/og)로 그린다. 서버 전용: fs로 폰트·이미지를 읽는다.
// satori 규칙: 자식이 둘 이상인 div는 display:flex, CSS 변수 불가, WOFF2 불가.

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#1C1917";
const INK_MUTED = "#78716C";
const INK_FAINT = "#A8A29E";
const IVORY = "#F8F6F1";
const IVORY_WARM = "#F0EDE5";
const GOLD = "#A68B5B";
const GOLD_LIGHT = "#C4AD82";
const BORDER = "#E7E2D8";
const PILLAR_LABELS = ["년주", "월주", "일주", "시주"];
const ELEMENTS = ["木", "火", "土", "金", "水"];

/** 한 글자 — "병(丙)" 형태: 한글 음 크게 + 괄호 한자 작게, 오행색 */
function Glyph({ korean, hanja, color }: { korean: string; hanja: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", color, lineHeight: 1.1 }}>
      <div style={{ display: "flex", fontSize: 46, fontWeight: 700 }}>{korean}</div>
      <div style={{ display: "flex", fontSize: 28, fontWeight: 400, marginLeft: 2 }}>({hanja})</div>
    </div>
  );
}

type OgFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };
type OgAssets = { fonts: OgFont[]; mascot: string };

let assetsPromise: Promise<OgAssets> | null = null;

/** public/fonts 서브셋 WOFF 2종 + 까치 아이콘(data URI). 프로세스당 한 번만 읽는다. */
export function loadOgAssets(): Promise<OgAssets> {
  assetsPromise ??= (async () => {
    const root = process.cwd();
    const fonts = await Promise.all(
      ([400, 700] as const).map(async (weight) => ({
        name: "Noto Sans KR",
        data: await readFile(join(root, "public/fonts", `NotoSansKR-${weight}.woff`)),
        weight,
        style: "normal" as const,
      })),
    );
    const icon = await readFile(join(root, "public/kkachi/icon-192.png"));
    return { fonts, mascot: `data:image/png;base64,${icon.toString("base64")}` };
  })();
  return assetsPromise;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const outer = {
  width: "100%",
  height: "100%",
  display: "flex",
  background: IVORY,
  padding: 40,
  fontFamily: "Noto Sans KR",
  color: INK,
} as const;

const inner = {
  display: "flex",
  flex: 1,
  border: `2px solid ${GOLD_LIGHT}`,
  borderRadius: 28,
  background: "#FFFFFF",
  padding: "34px 44px",
} as const;

/** 공유 카드 — 이름 · 팔자 타일(오행색) · 오행 분포 · 한 줄 요약 · CTA */
export function ShareOgImage({ card, mascot }: { card: ShareCard; mascot: string }) {
  const who = card.name ? `${card.name}님` : "나";
  const maxCount = Math.max(1, ...ELEMENTS.map((e) => card.element_stats[e] ?? 0));
  const headline = clip(card.pillar_summary || card.summary.me || "", 76);

  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>사주까치</div>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 2 }}>{who}의 사주 카드</div>
          </div>
          <img src={mascot} alt="" width={88} height={88} style={{ borderRadius: 44 }} />
        </div>

        <div style={{ display: "flex", flex: 1, marginTop: 24, gap: 36, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {card.pillars.map((p, i) => {
              const el = card.pillar_elements[i];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 132,
                    borderRadius: 18,
                    background: IVORY_WARM,
                    border: `1px solid ${BORDER}`,
                    padding: "10px 0 12px",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", fontSize: 18, color: INK_MUTED }}>{PILLAR_LABELS[i]}</div>
                  <Glyph korean={card.pillar_stems_korean?.[i] ?? ""} hanja={p[0]} color={getElementInfo(el?.stem_element ?? "").color} />
                  <Glyph korean={card.pillar_branches_korean?.[i] ?? ""} hanja={p[1]} color={getElementInfo(el?.branch_element ?? "").color} />
                </div>
              );
            })}
            {card.hour_unknown && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 132,
                  borderRadius: 18,
                  border: `2px dashed ${BORDER}`,
                  color: INK_FAINT,
                }}
              >
                <div style={{ display: "flex", fontSize: 18 }}>시주</div>
                <div style={{ display: "flex", fontSize: 56, fontWeight: 700 }}>?</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
            {ELEMENTS.map((e) => {
              const n = card.element_stats[e] ?? 0;
              const info = getElementInfo(e);
              return (
                <div key={e} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", width: 104, fontSize: 22, fontWeight: 700, color: info.color }}>{info.korean}({e})</div>
                  <div style={{ display: "flex", flex: 1, height: 18, borderRadius: 9, background: IVORY_WARM }}>
                    <div style={{ display: "flex", width: `${Math.round((n / maxCount) * 100)}%`, height: 18, borderRadius: 9, background: info.borderColor }} />
                  </div>
                  <div style={{ display: "flex", width: 40, fontSize: 20, color: INK_MUTED, justifyContent: "flex-end" }}>{n}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
          <div style={{ display: "flex", fontSize: 26, lineHeight: 1.4, color: INK }}>{headline}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", fontSize: 20, color: INK_FAINT }}>
              {card.day_stem_korean}({card.day_stem}) 일간 · {card.strength_label} · 용신 {getElementInfo(card.yongshin.name).korean}({card.yongshin.name})
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>나도 30초 만에 내 사주 보기 →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LEVEL_COLORS: Record<string, { fg: string; bg: string }> = {
  "좋은 날": { fg: "#1B6B3A", bg: "#E6F4EA" },
  "평범한 날": { fg: "#8A4F00", bg: "#FBF1DC" },
  "주의가 필요한 날": { fg: "#B02020", bg: "#FBE4E1" },
};

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

/** 시운 공유 카드 — 일진 타일 · 점수/레벨 · 아침 한 마디 · 날씨/절기 · CTA */
export function DailyOgImage({ card, mascot }: { card: DailyShareCard; mascot: string }) {
  const el = getElementInfo(card.day_element);
  const lv = LEVEL_COLORS[card.level] ?? LEVEL_COLORS["평범한 날"];
  const k = card.day_pillar_korean;
  const badges = [
    card.solar_term ?? "",
    card.weather ? `${getElementInfo(card.weather.element).korean}(${card.weather.element}) 기운 · ${card.weather.condition}` : "",
    card.son_eomneun_nal ? "손없는 날" : "",
    card.yongshin ? `용신 ${getElementInfo(card.yongshin).korean}(${card.yongshin})` : "",
  ].filter(Boolean);

  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>사주까치 · {fmtDate(card.date)}</div>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 2 }}>{card.name}님의 오늘 시운</div>
          </div>
          <img src={mascot} alt="" width={88} height={88} style={{ borderRadius: 44 }} />
        </div>

        <div style={{ display: "flex", flex: 1, marginTop: 22, gap: 32, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 150,
              borderRadius: 18,
              background: IVORY_WARM,
              border: `1px solid ${BORDER}`,
              padding: "10px 0 12px",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", fontSize: 18, color: INK_MUTED }}>일진</div>
            <Glyph korean={k[0] ?? ""} hanja={card.day_pillar[0] ?? ""} color={el.color} />
            <Glyph korean={k[1] ?? ""} hanja={card.day_pillar[1] ?? ""} color={el.color} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 170, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", fontWeight: 700 }}>
              <div style={{ display: "flex", fontSize: 72, lineHeight: 1 }}>{card.total_score}</div>
              <div style={{ display: "flex", fontSize: 24, color: INK_MUTED, marginLeft: 4 }}>점</div>
            </div>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: lv.fg, background: lv.bg, borderRadius: 999, padding: "6px 16px" }}>{card.level}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, lineHeight: 1.35 }}>{clip(card.headline, 60)}</div>
            {card.action && <div style={{ display: "flex", fontSize: 23, color: INK, lineHeight: 1.35 }}>할 것 · {clip(card.action, 44)}</div>}
            {card.caution && <div style={{ display: "flex", fontSize: 23, color: INK_MUTED, lineHeight: 1.35 }}>피할 것 · {clip(card.caution, 44)}</div>}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", fontSize: 20, color: INK_FAINT }}>{badges.join("  ·  ")}</div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>나도 오늘 시운 보기 →</div>
        </div>
      </div>
    </div>
  );
}

/** 궁합 공유 카드 — 점수·라벨 · 두 사람 일간 · 영역 점수 · 한 줄 · CTA */
export function CompatOgImage({ card, mascot }: { card: CompatShareCard; mascot: string }) {
  const tone = card.total_score >= 70 ? LEVEL_COLORS["좋은 날"] : card.total_score >= 50 ? LEVEL_COLORS["평범한 날"] : LEVEL_COLORS["주의가 필요한 날"];
  const domains = Object.entries(card.domain_scores).slice(0, 4);
  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>사주까치 · {card.relation_label} 궁합</div>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 2 }}>{card.name1}님과 {card.name2}님</div>
          </div>
          <img src={mascot} alt="" width={88} height={88} style={{ borderRadius: 44 }} />
        </div>

        <div style={{ display: "flex", flex: 1, marginTop: 22, gap: 32, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 200, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", fontWeight: 700 }}>
              <div style={{ display: "flex", fontSize: 88, lineHeight: 1 }}>{card.total_score}</div>
              <div style={{ display: "flex", fontSize: 26, color: INK_MUTED, marginLeft: 4 }}>점</div>
            </div>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: tone.fg, background: tone.bg, borderRadius: 999, padding: "6px 16px" }}>{card.label}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 190 }}>
            {[{ name: card.name1, d: card.p1 }, { name: card.name2, d: card.p2 }].map(({ name, d }) => (
              <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 16, background: IVORY_WARM, border: `1px solid ${BORDER}`, padding: "8px 0" }}>
                <div style={{ display: "flex", fontSize: 18, color: INK_MUTED }}>{name}</div>
                <div style={{ display: "flex", alignItems: "baseline", color: getElementInfo(d.element).color, lineHeight: 1.1 }}>
                  <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{d.korean}</div>
                  <div style={{ display: "flex", fontSize: 22, marginLeft: 2 }}>({d.stem})</div>
                  <div style={{ display: "flex", fontSize: 16, color: INK_FAINT, marginLeft: 6 }}>일간</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
            {domains.map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", width: 96, fontSize: 22, fontWeight: 700, color: INK }}>{k}</div>
                <div style={{ display: "flex", flex: 1, height: 18, borderRadius: 9, background: IVORY_WARM }}>
                  <div style={{ display: "flex", width: `${Math.max(4, Math.min(100, v.score))}%`, height: 18, borderRadius: 9, background: GOLD_LIGHT }} />
                </div>
                <div style={{ display: "flex", width: 44, fontSize: 20, color: INK_MUTED, justifyContent: "flex-end" }}>{v.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
          <div style={{ display: "flex", fontSize: 24, lineHeight: 1.4, color: INK }}>{clip(card.description || "", 70)}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", fontSize: 20, color: INK_FAINT }}>{card.key_traits.slice(0, 3).join("  ·  ")}</div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>우리도 궁합 보기 →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 사이트 기본 OG — 홈·분석 등 카드가 없는 페이지 */
export function BrandOgImage({ mascot }: { mascot: string }) {
  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "row", alignItems: "center", gap: 48, padding: "40px 64px" }}>
        <img src={mascot} alt="" width={220} height={220} style={{ borderRadius: 110 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: GOLD }}>사주까치</div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>30초 만에 내 사주 보기</div>
          <div style={{ display: "flex", fontSize: 26, color: INK_MUTED, marginTop: 18, lineHeight: 1.5 }}>타고난 팔자 · 올해 흐름 · 언제가 좋을까 · 아침 한 마디</div>
          <div style={{ display: "flex", fontSize: 22, color: INK_FAINT, marginTop: 26 }}>까치가 울면 반가운 소식이 온다</div>
        </div>
      </div>
    </div>
  );
}
