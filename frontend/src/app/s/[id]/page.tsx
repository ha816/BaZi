import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import KkachiTip from "@/components/KkachiTip";
import SectionHeader from "@/components/SectionHeader";
import { FORECAST_LEVEL_META, getElementInfo } from "@/lib/elementColors";
import { RELATION_GLYPH } from "@/lib/relations";
import type { CompatShareCard, DailyShareCard } from "@/types/analysis";
import { fetchShare } from "./share";

// 공유받은 사람이 여는 카드 페이지 — 서버 렌더(미리보기 크롤러도 본문을 읽는다). 로그인 없음.
type Props = { params: Promise<{ id: string }> };
const PILLAR_LABELS = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
const ELEMENTS = ["木", "火", "土", "金", "水"];

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await fetchShare((await params).id);
  if (!card) return { title: "사주 카드" };
  if (card.kind === "daily") {
    const title = `${card.name}님의 오늘 시운 · ${fmtDate(card.date)}`;
    const description = [card.headline, card.action].filter(Boolean).join(" ");
    return {
      title,
      description,
      openGraph: { siteName: "사주까치", locale: "ko_KR", type: "article", title: `${title} | 사주까치`, description },
      twitter: { card: "summary_large_image" },
      robots: { index: false },
    };
  }
  if (card.kind === "compat") {
    const title = `${card.name1 || "첫 번째 분"}님과 ${card.name2 || "두 번째 분"}님의 ${card.relation_label} 궁합 ${card.total_score}점`;
    const description = card.description || card.label;
    return {
      title,
      description,
      openGraph: { siteName: "사주까치", locale: "ko_KR", type: "article", title: `${title} | 사주까치`, description },
      twitter: { card: "summary_large_image" },
      robots: { index: false },
    };
  }
  const who = card.name ? `${card.name}님` : "나";
  const description = card.pillar_summary || card.summary.me || "사주까치가 본 사주 카드";
  return {
    title: `${who}의 사주 카드`,
    description,
    openGraph: { siteName: "사주까치", locale: "ko_KR", type: "article", title: `${who}의 사주 카드 | 사주까치`, description },
    twitter: { card: "summary_large_image" },
    robots: { index: false },
  };
}

/** 시운 공유 카드 — 오늘 일진·점수·아침 한 마디·날씨. 생년월일 없음 */
function DailyShareView({ card }: { card: DailyShareCard }) {
  const who = `${card.name}님`;
  const meta = FORECAST_LEVEL_META[card.level] ?? FORECAST_LEVEL_META["평범한 날"];
  const el = getElementInfo(card.day_element);
  const k = card.day_pillar_korean;
  const badges = [
    card.solar_term ? `🌿 절기 ${card.solar_term}` : "",
    card.weather ? `${card.weather.condition} · ${getElementInfo(card.weather.element).korean}(${card.weather.element}) 기운` : "",
    card.son_eomneun_nal ? "👻 손없는 날" : "",
    card.yongshin ? `용신(用神) ${getElementInfo(card.yongshin).korean}(${card.yongshin})` : "",
  ].filter(Boolean);

  return (
    <main className="page page--center">
      <div className="page__inner">
        <header className="flex items-center gap-3">
          <img src="/kkachi/icon-192.png" alt="사주까치" className="w-12 h-12 rounded-full" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-gold)]">사주까치 · {fmtDate(card.date)}</p>
            <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{who}의 오늘 시운</h1>
          </div>
        </header>

        <section className="slide-card">
          <div className="slide-card__header">
            <SectionHeader emoji="🌊" title="오늘의 일진(日辰)" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] px-5 py-3 text-center">
                <p className="text-[10px] text-[var(--color-ink-muted)] mb-1">일진</p>
                {[0, 1].map((i) => (
                  <p key={i} className="font-heading leading-tight whitespace-nowrap" style={{ color: el.color }}>
                    <span className="text-2xl font-bold">{k[i] ?? ""}</span>
                    <span className="text-sm">({card.day_pillar[i]})</span>
                  </p>
                ))}
              </div>
              <div className="space-y-1">
                <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">
                  {card.total_score}<span className="text-base font-normal text-[var(--color-ink-muted)]">점</span>
                </p>
                <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.icon} {card.level}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold leading-snug text-[var(--color-ink)]">{card.headline}</p>
              {card.action && <p className="text-sm text-[var(--color-ink)]">✦ 할 것 · {card.action}</p>}
              {card.caution && <p className="text-sm text-[var(--color-ink-light)]">✕ 피할 것 · {card.caution}</p>}
            </div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span key={b} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)]">{b}</span>
                ))}
              </div>
            )}
            {card.tips[0] && <KkachiTip>{card.tips[0]}</KkachiTip>}
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--color-ink)] text-[var(--color-ivory)] p-5 text-center space-y-3">
          <p className="font-heading text-lg font-bold">나도 오늘 시운 보기</p>
          <p className="text-xs opacity-70">이름과 생년월일만 넣으면 내 사주와 오늘의 흐름까지, 30초면 돼요. 등록하면 매일 아침 한 마디도 받아요.</p>
          <Link href="/" className="block w-full py-3 rounded-lg bg-[var(--color-gold)] text-[var(--color-ink)] text-sm font-semibold hover:bg-[var(--color-gold-light)] transition-colors">
            내 사주 보기
          </Link>
        </section>
      </div>
    </main>
  );
}

// 임계 65/45 = 백엔드 TOTAL_LABEL_BY_REL(80/65/45)과 맞춤. 색은 FORECAST_LEVEL_META.badge와 동일
const scoreTone = (score: number) =>
  score >= 65 ? "bg-emerald-100 text-emerald-800" : score >= 45 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";

/** 궁합 공유 카드 — 점수·라벨·두 사람 일간·영역 점수·특징. 생년월일 없음 */
function CompatShareView({ card }: { card: CompatShareCard }) {
  const domains = Object.entries(card.domain_scores);
  const n1 = card.name1 || "첫 번째 분";
  const n2 = card.name2 || "두 번째 분";
  const glyph = RELATION_GLYPH[card.relation_type] ?? "♥";
  return (
    <main className="page page--center">
      <div className="page__inner">
        <header className="flex items-center gap-3">
          <img src="/kkachi/icon-192.png" alt="사주까치" className="w-12 h-12 rounded-full" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-gold)]">사주까치 · {card.relation_label} 궁합</p>
            <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{n1}님 <span className="text-[var(--color-gold)]">{glyph}</span> {n2}님</h1>
          </div>
        </header>

        <section className="slide-card">
          <div className="slide-card__header">
            <SectionHeader emoji="💞" title="종합 궁합" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <div className="flex items-center gap-4">
              <p className="font-heading text-4xl font-bold text-[var(--color-ink)]">
                {card.total_score}<span className="text-base font-normal text-[var(--color-ink-muted)]">점</span>
              </p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreTone(card.total_score)}`}>{card.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ name: n1, d: card.p1 }, { name: n2, d: card.p2 }].map(({ name, d }, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] px-3 py-2 text-center">
                  <p className="text-[11px] text-[var(--color-ink-muted)] truncate">{name}</p>
                  <p className="font-heading leading-tight whitespace-nowrap" style={{ color: getElementInfo(d.element).color }}>
                    <span className="text-xl font-bold">{d.korean}</span>
                    <span className="text-xs">({d.stem})</span>
                    <span className="text-[10px] text-[var(--color-ink-faint)]"> 일간</span>
                  </p>
                </div>
              ))}
            </div>
            {card.description && <KkachiTip>{card.description}</KkachiTip>}
            {domains.length > 0 && (
              <div className="space-y-1.5">
                {domains.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-12 font-semibold text-[var(--color-ink)]">{k}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-ivory-warm)]">
                      <div className="h-2 rounded-full bg-[var(--color-gold)]" style={{ width: `${Math.max(4, Math.min(100, v.score))}%` }} />
                    </div>
                    <span className="w-8 text-right text-[var(--color-ink-muted)]">{v.score}</span>
                  </div>
                ))}
              </div>
            )}
            {(card.key_traits.length > 0 || card.shared_sinsal.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {card.key_traits.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--color-gold-light)] text-[var(--color-gold)]">{t}</span>
                ))}
                {card.shared_sinsal.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)]">둘 다 {s}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--color-ink)] text-[var(--color-ivory)] p-5 text-center space-y-3">
          <p className="font-heading text-lg font-bold">우리 궁합도 보기</p>
          <p className="text-xs opacity-70">두 사람의 생년월일만 있으면 연인·친구·가족 궁합을 바로 봐요.</p>
          <Link href="/compatibility" className="block w-full py-3 rounded-lg bg-[var(--color-gold)] text-[var(--color-ink)] text-sm font-semibold hover:bg-[var(--color-gold-light)] transition-colors">
            궁합 보러 가기
          </Link>
          <Link href="/" className="block text-xs underline underline-offset-2 opacity-70">내 사주 먼저 보기</Link>
        </section>
      </div>
    </main>
  );
}

export default async function SharePage({ params }: Props) {
  const card = await fetchShare((await params).id);
  if (!card) notFound();
  if (card.kind === "daily") return <DailyShareView card={card} />;
  if (card.kind === "compat") return <CompatShareView card={card} />;
  const who = card.name ? `${card.name}님` : "나";
  const maxCount = Math.max(1, ...ELEMENTS.map((e) => card.element_stats[e] ?? 0));
  const lines = [
    { label: "나", text: card.summary.me },
    { label: "신살·운성", text: card.summary.energy },
    { label: "용신", text: card.summary.yongshin },
    { label: `${card.year}년`, text: card.summary.year },
    { label: "조심", text: card.summary.caution },
  ].filter((l) => l.text);

  return (
    <main className="page">
      <div className="page__inner">
        <header className="flex items-center gap-3">
          <img src="/kkachi/icon-192.png" alt="사주까치" className="w-12 h-12 rounded-full" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-gold)]">사주까치</p>
            <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{who}의 사주 카드</h1>
          </div>
        </header>

        <section className="slide-card">
          <div className="slide-card__header">
            <SectionHeader emoji="🌱" title="사주팔자(四柱八字)" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <KkachiTip>{`${who}의 사주를 까치가 이렇게 봤어요. ${card.pillar_summary}`}</KkachiTip>
            <div className={`grid gap-2 ${card.pillars.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {card.pillars.map((p, i) => {
                const el = card.pillar_elements[i];
                return (
                  <div key={i} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] py-3 text-center">
                    <p className="text-[10px] text-[var(--color-ink-muted)] mb-1">{PILLAR_LABELS[i]}</p>
                    {[
                      { korean: card.pillar_stems_korean?.[i] ?? "", hanja: p[0], color: getElementInfo(el?.stem_element ?? "").color },
                      { korean: card.pillar_branches_korean?.[i] ?? "", hanja: p[1], color: getElementInfo(el?.branch_element ?? "").color },
                    ].map((g) => (
                      <p key={g.hanja} className="font-heading leading-tight whitespace-nowrap" style={{ color: g.color }}>
                        <span className="text-2xl font-bold">{g.korean}</span>
                        <span className="text-sm">({g.hanja})</span>
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
            {card.hour_unknown && (
              <p className="text-[11px] text-[var(--color-ink-faint)]">⚠️ 출생시간을 몰라 연주, 월주, 일주로만 분석했어요.</p>
            )}
            <div className="space-y-1.5">
              {ELEMENTS.map((e) => {
                const n = card.element_stats[e] ?? 0;
                const info = getElementInfo(e);
                return (
                  <div key={e} className="flex items-center gap-2 text-xs">
                    <span className="w-14 font-bold" style={{ color: info.color }}>{info.korean}({e})</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-ivory-warm)]">
                      <div className="h-2 rounded-full" style={{ width: `${(n / maxCount) * 100}%`, background: info.borderColor }} />
                    </div>
                    <span className="w-4 text-right text-[var(--color-ink-muted)]">{n}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {card.day_stem_korean}({card.day_stem}) 일간 · {card.strength_label} · 용신(用神) {getElementInfo(card.yongshin.name).korean}({card.yongshin.name})
            </p>
            {card.sinsal.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.sinsal.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--color-gold-light)] text-[var(--color-gold)]">{s}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        {lines.length > 0 && (
          <section className="slide-card">
            <div className="slide-card__header">
              <SectionHeader emoji="🐦" title="까치 한눈에" noMargin />
            </div>
            <div className="divider" />
            <ul className="slide-card__body space-y-2">
              {lines.map((l) => (
                <li key={l.label} className="flex items-start gap-2 text-sm leading-snug">
                  <span className="flex-shrink-0 w-16 text-[11px] font-semibold text-[var(--color-ink-faint)] pt-0.5">{l.label}</span>
                  <span className="flex-1 text-[var(--color-ink)]">{l.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl bg-[var(--color-ink)] text-[var(--color-ivory)] p-5 text-center space-y-3">
          <p className="font-heading text-lg font-bold">나도 30초 만에 내 사주 보기</p>
          <p className="text-xs opacity-70">이름과 생년월일만 넣으면 팔자·올해 흐름·좋은 달까지. 로그인 없이.</p>
          <Link href="/" className="block w-full py-3 rounded-lg bg-[var(--color-gold)] text-[var(--color-ink)] text-sm font-semibold hover:bg-[var(--color-gold-light)] transition-colors">
            내 사주 보기
          </Link>
        </section>
      </div>
    </main>
  );
}
