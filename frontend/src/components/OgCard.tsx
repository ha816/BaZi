import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CompatShareCard, DailyShareCard, ShareCard } from "@/types/analysis";
import { sealPose } from "./LuckySeal";
import { getElementInfo } from "@/lib/elementColors";
import { RELATION_GLYPH } from "@/lib/relations";

// 링크 미리보기(OG) 이미지 — satori(next/og)로 그린다. 서버 전용: fs로 폰트·이미지를 읽는다.
// satori 규칙: 자식이 둘 이상인 div는 display:flex, CSS 변수 불가, WOFF2 불가.
// 글자 규칙: public/fonts 서브셋에 없는 기호(✦ ✕ 이모지)는 빈 네모로 나온다 — 쓸 수 있는 기호 ♥ ★ ✿ ✓ ※ →

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#1C1917";
const INK_MUTED = "#78716C";
const INK_FAINT = "#A8A29E";
const IVORY = "#F8F6F1";
const IVORY_WARM = "#F0EDE5";
const GOLD = "#A68B5B";
const GOLD_LIGHT = "#C4AD82";
const BORDER = "#E0D9CE"; // = --color-border
const PILLAR_LABELS = ["년주", "월주", "일주", "시주"];
const ELEMENTS = ["木", "火", "土", "金", "水"];

/** 한 글자 — "병(丙)" 형태: 한글 음 크게 + 괄호 한자 작게, 오행색 */
function Glyph({ korean, hanja, color, size = 46 }: { korean: string; hanja: string; color: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", color, lineHeight: 1.1 }}>
      <div style={{ display: "flex", fontSize: size, fontWeight: 700 }}>{korean}</div>
      <div style={{ display: "flex", fontSize: Math.round(size * 0.6), fontWeight: 400, marginLeft: 2 }}>({hanja})</div>
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

const artCache = new Map<string, Promise<string | null>>();

/** OG용 캐릭터 그림(public/kkachi/{relPath}, 512px JPEG) → data URI. satori가 WebP를 못 읽어 JPEG를 따로 둔다. 없으면 null, 경로별 캐시 */
function loadArt(relPath: string): Promise<string | null> {
  let art = artCache.get(relPath);
  if (!art) {
    art = readFile(join(process.cwd(), "public/kkachi", relPath))
      .then((buf) => `data:image/jpeg;base64,${buf.toString("base64")}`)
      .catch(() => null);
    artCache.set(relPath, art);
  }
  return art;
}

/** 직인 그림(투명 PNG) — 시운 좋은 날 unsu_daetong, 궁합 80점 이상 cheonsaeng_yeonbun·magyeok_jigyo·gahwa_mansa */
export function loadSealArt(name = "unsu_daetong"): Promise<string | null> {
  const rel = `seal/${name}.png`;
  let art = artCache.get(rel);
  if (!art) {
    art = readFile(join(process.cwd(), "public/kkachi", rel)).then((b) => `data:image/png;base64,${b.toString("base64")}`).catch(() => null);
    artCache.set(rel, art);
  }
  return art;
}

/** 나의 캐릭터(사주 카드, V4) — saju_character/og/{artKey}.jpg. artKey = 일간_강|약[_여](여성판, 2026-10-23), 없으면 유형 키 그림 */
export async function loadCharacterArt(key: string, artKey?: string | null): Promise<string | null> {
  const ok = (k?: string | null): k is string => !!k && /^[가-힣]_[강약](_여)?$/.test(k);
  if (ok(artKey) && artKey !== key) {
    const art = await loadArt(`saju_character/og/${artKey}.jpg`);
    if (art) return art;
  }
  return ok(key) ? loadArt(`saju_character/og/${key}.jpg`) : null;
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

/** 팔자 타일 줄 — 년·월·일·시(시간 모름이면 ? 타일). size는 글자 크기, 타일 폭·여백은 그에 맞춰 */
function PillarTiles({ card, size = 46 }: { card: ShareCard; size?: number }) {
  const big = size >= 46;
  const width = big ? 132 : 100;
  return (
    <div style={{ display: "flex", gap: big ? 14 : 10 }}>
      {card.pillars.map((p, i) => {
        const el = card.pillar_elements[i];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width,
              borderRadius: 18,
              background: IVORY_WARM,
              border: `1px solid ${BORDER}`,
              padding: big ? "10px 0 12px" : "8px 0 10px",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", fontSize: big ? 18 : 16, color: INK_MUTED }}>{PILLAR_LABELS[i]}</div>
            <Glyph korean={card.pillar_stems_korean?.[i] ?? ""} hanja={p[0]} color={getElementInfo(el?.stem_element ?? "").color} size={size} />
            <Glyph korean={card.pillar_branches_korean?.[i] ?? ""} hanja={p[1]} color={getElementInfo(el?.branch_element ?? "").color} size={size} />
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
            width,
            borderRadius: 18,
            border: `2px dashed ${BORDER}`,
            color: INK_FAINT,
          }}
        >
          <div style={{ display: "flex", fontSize: big ? 18 : 16 }}>시주</div>
          <div style={{ display: "flex", fontSize: big ? 56 : 40, fontWeight: 700 }}>?</div>
        </div>
      )}
    </div>
  );
}

/** 공유 카드 — 이름 · 팔자 타일(오행색) · 오행 분포 · 한 줄 요약 · CTA.
 *  나의 캐릭터(V4)가 있으면 그림·유형명이 주인공: 왼쪽 그림, 오른쪽 유형명·한 줄·팔자 타일(작게)·선호하는 일. 오행 분포·신살·요약 줄은 뺀다 */
/** 오른쪽 위 브랜드 — "사주까치" 글자 + 까치 아이콘 (2026-10-23, 왼쪽 위 작은 "사주까치"는 여기로 옮김) */
function BrandMark({ mascot }: { mascot: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: GOLD }}>사주까치</div>
      <img src={mascot} alt="" width={88} height={88} style={{ borderRadius: 44 }} />
    </div>
  );
}

export function ShareOgImage({ card, mascot, characterArt }: { card: ShareCard; mascot: string; characterArt?: string | null }) {
  const who = card.name ? `${clip(card.name, 10)}님` : "나";
  const ch = card.character;
  // 아래 줄(용신·CTA)은 2026-10-23 뺐다 — CTA는 오른쪽 위 "사주까치"·까치 아이콘 바로 아래로(사용자 지시)
  const cta = ch ? "나는 어떤 캐릭터일까? 30초 만에 →" : "나도 30초 만에 내 사주 보기 →";
  // 왼쪽 위 "○○님의 사주 카드" 제목은 2026-10-23 뺐다(사용자 지시) — 이름은 아래 "○○님의 캐릭터" 줄이 맡는다
  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <BrandMark mascot={mascot} />
        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: GOLD }}>{cta}</div>
      </div>
    </div>
  );

  if (ch) {
    const el = getElementInfo(ch.element);
    // 2026-10-23: 제목 줄을 빼고 — 위는 그림(360px) + 글 묶음, 맨 아래 구분선 밑 한 줄에 까치·사주까치(왼쪽)와 CTA(오른쪽)
    return (
      <div style={outer}>
        <div style={{ ...inner, flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1, gap: 36, alignItems: "center" }}>
            {characterArt && <img src={characterArt} alt="" width={360} height={360} style={{ borderRadius: 28, border: `1px solid ${BORDER}` }} />}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>{who}의 사주 캐릭터</div>
              <div style={{ display: "flex", fontSize: 50, fontWeight: 700, lineHeight: 1.15 }}>{clip(ch.title, 13)}</div>
              {/* 한 줄 설명(ch.line)은 2026-10-23 뺐다 — 어색한 표현이 많아서(사용자 지시) */}
              <div style={{ display: "flex", marginTop: 4 }}><PillarTiles card={card} size={46} /></div>
              {ch.jobs.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ display: "flex", fontSize: 18, color: INK_MUTED }}>선호하는 일</div>
                  {ch.jobs.slice(0, 3).map((j) => (
                    <div key={j} style={{ display: "flex", fontSize: 18, fontWeight: 700, color: el.color, background: el.bgColor, border: `1px solid ${el.borderColor}`, borderRadius: 999, padding: "4px 12px" }}>{j}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={mascot} alt="" width={44} height={44} style={{ borderRadius: 22 }} />
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: GOLD }}>사주까치</div>
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>{cta}</div>
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(1, ...ELEMENTS.map((e) => card.element_stats[e] ?? 0));
  const headline = clip(card.pillar_summary || card.summary.me || "", 76);
  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "column" }}>
        {header}

        <div style={{ display: "flex", flex: 1, marginTop: 24, gap: 36, alignItems: "center" }}>
          <PillarTiles card={card} />

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
            {card.sinsal.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {card.sinsal.slice(0, 3).map((s) => (
                  <div key={s} style={{ display: "flex", fontSize: 18, fontWeight: 700, color: GOLD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: 999, padding: "4px 12px" }}>{s}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
          <div style={{ display: "flex", fontSize: 26, lineHeight: 1.4, color: INK }}>{headline}</div>
        </div>
      </div>
    </div>
  );
}

// = Tailwind emerald/amber/rose -800(fg)·-100(bg) — 페이지의 FORECAST_LEVEL_META.badge 클래스와 같은 색
const LEVEL_COLORS: Record<string, { fg: string; bg: string }> = {
  "좋은 날": { fg: "#006045", bg: "#d0fae5" },
  "평범한 날": { fg: "#973c00", bg: "#fef3c6" },
  "주의가 필요한 날": { fg: "#a50036", bg: "#ffe4e6" },
};

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

/** 시운 공유 카드 — 일진 타일 · 점수/레벨 · 아침 한 마디 · 날씨/절기 · CTA */
export function DailyOgImage({ card, mascot, seal }: { card: DailyShareCard; mascot: string; seal?: string | null }) {
  const el = getElementInfo(card.day_element);
  const lv = LEVEL_COLORS[card.level] ?? LEVEL_COLORS["평범한 날"];
  const k = card.day_pillar_korean;
  const pose = sealPose(card.date); // 직인 기울기·위치 — 같은 날짜면 공유 페이지·시운 화면과 같다
  // 2026-10-23 사주 카드와 같은 기준으로 — 큰 제목 대신 날짜·이름 한 줄, 일진·점수를 키우고,
  // 잘리던 절기·날씨·용신 줄은 빼고 구분선 밑 한 줄에 까치·"사주까치" | CTA
  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: GOLD }}>
          {clip(card.name, 10)}님의 {fmtDate(card.date).replace(" (", "(")} 시운
        </div>

        {/* 점수가 맨 왼쪽 주인공, 일진은 한 줄 언급만. 좋은 날이면 점수 위에 "운수대통" 직인(정지 그림 — 애니메이션은 랜딩에서), 2026-10-23 */}
        <div style={{ display: "flex", flex: 1, gap: 44, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 300, gap: 14, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "baseline", fontWeight: 700, paddingTop: 18 }}>
              <div style={{ display: "flex", fontSize: 150, lineHeight: 1 }}>{card.total_score}</div>
              <div style={{ display: "flex", fontSize: 36, color: INK_MUTED, marginLeft: 6 }}>점</div>
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: lv.fg, background: lv.bg, borderRadius: 999, padding: "8px 22px" }}>{card.level}</div>
            {card.level === "좋은 날" && seal && (
              <img src={seal} alt="" width={120} height={120} style={{ position: "absolute", top: -14 + Math.round(pose.dy * 17), right: -14 - Math.round(pose.dx * 17), transform: `rotate(${pose.rotate}deg)` }} />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
            <div style={{ display: "flex", fontSize: 22, color: INK_MUTED }}>
              오늘의 일진&nbsp;<span style={{ color: el.color, fontWeight: 700 }}>{k}({card.day_pillar})</span>
            </div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, lineHeight: 1.35, wordBreak: "keep-all" }}>{clip(card.headline, 48)}</div>
            {card.action && <div style={{ display: "flex", fontSize: 25, color: INK, lineHeight: 1.4, wordBreak: "keep-all" }}>할 것: {clip(card.action, 40)}</div>}
            {card.caution && <div style={{ display: "flex", fontSize: 25, color: INK_MUTED, lineHeight: 1.4, wordBreak: "keep-all" }}>피할 것: {clip(card.caution, 40)}</div>}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={mascot} alt="" width={44} height={44} style={{ borderRadius: 22 }} />
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: GOLD }}>사주까치</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>나도 오늘의 행운 보기 →</div>
        </div>
      </div>
    </div>
  );
}

/** 궁합 공유 카드 — 캐릭터 칭호 · 점수·라벨 · 두 사람 일간(역할) · 영역 점수 · 한 줄 · CTA.
 *  궁합 캐릭터 그림(compat/og/{key}.jpg)이 있으면 왼쪽에 232px로 넣고 점수·일간 칸을 좁힌다(2026-10-17, 사주 카드 V4와 같은 자리). 없으면 글자만 */
export function CompatOgImage({ card, mascot, characterArts = [], seal }: { card: CompatShareCard; mascot: string; characterArts?: (string | null)[]; seal?: string | null }) {
  // 2026-10-23 사주·시운 카드와 같은 기준 — 이름·관계는 한 줄, 칭호가 제목, 일간 칸·설명 문장·잘리던 특징 줄은 빼고
  // 두 캐릭터 그림·점수를 키운다. 75점 이상이면 점수 위에 관계별 직인(정지 그림 — 애니메이션은 랜딩에서)
  const arts = characterArts.filter((a): a is string => !!a);
  const hasArt = arts.length > 0;
  // 임계 65/45 = 백엔드 TOTAL_LABEL_BY_REL(80/65/45)과 맞춤
  const tone = card.total_score >= 65 ? LEVEL_COLORS["좋은 날"] : card.total_score >= 45 ? LEVEL_COLORS["평범한 날"] : LEVEL_COLORS["주의가 필요한 날"];
  const n1 = card.name1 || "첫 번째 분";
  const n2 = card.name2 || "두 번째 분";
  const glyph = RELATION_GLYPH[card.relation_type] ?? "♥";
  const ch = card.character;
  const pose = sealPose(`${n1}${n2}${card.total_score}`);
  return (
    <div style={outer}>
      <div style={{ ...inner, flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 24, fontWeight: 700, color: GOLD }}>
          {clip(n1, 6)}님<div style={{ display: "flex", margin: "0 8px" }}>{glyph}</div>{clip(n2, 6)}님의 {card.relation_label} 궁합
        </div>

        {/* 영역 막대(연애·결혼…)는 2026-10-23 뺐다 — 종합 점수만(사용자 지시). 빈자리만큼 그림·점수를 키워 가운데로 */}
        <div style={{ display: "flex", flex: 1, gap: 14, alignItems: "center", justifyContent: "center" }}>
          {hasArt && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* 그림 아래 "○○님 = 역할 · 오행" — 칭호의 들판·햇볕 같은 역할 이름이 누구이고 무슨 기운인지(2026-10-23, 사용자 지시) */}
              {[0, 1].map((i) => {
                const role = ch?.roles[i];
                const info = role ? getElementInfo(role.element) : null;
                const name = i === 0 ? n1 : n2;
                return arts[i] ? (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {i === 1 && <div style={{ display: "flex", fontSize: 32, color: GOLD_LIGHT, marginTop: -40 }}>{glyph}</div>}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <img src={arts[i]} alt="" width={272} height={272} style={{ borderRadius: 26, border: `1px solid ${BORDER}` }} />
                      {role && info && (
                        <div style={{ display: "flex", alignItems: "baseline", fontSize: 21, fontWeight: 700, color: info.color }}>
                          <div style={{ display: "flex", color: INK }}>{clip(name, 5)}님</div>
                          <div style={{ display: "flex", margin: "0 6px", color: INK_FAINT }}>=</div>
                          <div style={{ display: "flex" }}>{role.name}</div>
                          <div style={{ display: "flex", fontSize: 17, fontWeight: 400, marginLeft: 4 }}>· {info.korean}({role.element})</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
          {/* 가운데: 칭호 → 점수(종합 궁합 글자 없이)·라벨·직인 / 오른쪽: 잘 맞는 순간 (2026-10-23, 사용자 지시) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 214, position: "relative" }}>
            <div style={{ display: "flex", fontSize: 27, fontWeight: 700, lineHeight: 1.25, textAlign: "center", justifyContent: "center", wordBreak: "keep-all", marginBottom: 4 }}>{clip(ch?.title ?? card.label, 18)}</div>
            <div style={{ display: "flex", alignItems: "baseline", fontWeight: 700 }}>
              <div style={{ display: "flex", fontSize: 92, lineHeight: 1 }}>{card.total_score}</div>
              <div style={{ display: "flex", fontSize: 28, color: INK_MUTED, marginLeft: 4 }}>점</div>
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: tone.fg, background: tone.bg, borderRadius: 999, padding: "7px 18px" }}>{card.label}</div>
            {seal && (
              <img src={seal} alt="" width={84} height={84} style={{ position: "absolute", top: 50 + Math.round(pose.dy * 6), right: -22 - Math.round(pose.dx * 6), transform: `rotate(${pose.rotate}deg)` }} />
            )}
          </div>
          {!!ch?.moments?.good?.length && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, width: 178 }}>
              <div style={{ display: "flex", fontSize: 18, color: INK_MUTED }}>잘 맞는 순간</div>
              {ch.moments.good.slice(0, 3).map((m) => (
                <div key={m} style={{ display: "flex", fontSize: 16, fontWeight: 700, color: GOLD, border: `1px solid ${GOLD_LIGHT}`, borderRadius: 999, padding: "5px 12px", background: "#FFFFFF" }}>{clip(m, 14)}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={mascot} alt="" width={44} height={44} style={{ borderRadius: 22 }} />
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: GOLD }}>사주까치</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: GOLD }}>우리 궁합도 보기 →</div>
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
