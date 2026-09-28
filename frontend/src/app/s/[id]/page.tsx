import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import KkachiTip from "@/components/KkachiTip";
import SectionHeader from "@/components/SectionHeader";
import { getElementInfo } from "@/lib/elementColors";
import { fetchShare } from "./share";

// 공유받은 사람이 여는 카드 페이지 — 서버 렌더(미리보기 크롤러도 본문을 읽는다). 로그인 없음.
type Props = { params: Promise<{ id: string }> };
const PILLAR_LABELS = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
const ELEMENTS = ["木", "火", "土", "金", "水"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await fetchShare((await params).id);
  if (!card) return { title: "사주 카드" };
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

export default async function SharePage({ params }: Props) {
  const card = await fetchShare((await params).id);
  if (!card) notFound();
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
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
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
                    <p className="font-heading text-3xl font-bold leading-tight" style={{ color: getElementInfo(el?.stem_element ?? "").color }}>{p[0]}</p>
                    <p className="font-heading text-3xl font-bold leading-tight" style={{ color: getElementInfo(el?.branch_element ?? "").color }}>{p[1]}</p>
                  </div>
                );
              })}
            </div>
            {card.hour_unknown && (
              <p className="text-[11px] text-[var(--color-ink-faint)]">🕰️ 출생시간을 몰라 세 기둥(三柱), 여섯 글자로 봤어요.</p>
            )}
            <div className="space-y-1.5">
              {ELEMENTS.map((e) => {
                const n = card.element_stats[e] ?? 0;
                const info = getElementInfo(e);
                return (
                  <div key={e} className="flex items-center gap-2 text-xs">
                    <span className="w-5 font-bold" style={{ color: info.color }}>{e}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-ivory-warm)]">
                      <div className="h-2 rounded-full" style={{ width: `${(n / maxCount) * 100}%`, background: info.borderColor }} />
                    </div>
                    <span className="w-4 text-right text-[var(--color-ink-muted)]">{n}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {card.day_stem}({card.day_stem_korean}) 일간 · {card.strength_label} · 용신(用神) {card.yongshin.name}
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
