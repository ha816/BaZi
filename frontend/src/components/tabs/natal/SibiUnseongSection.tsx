"use client";

import type { NatalResult, SibiUnseongInfo } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import { UNSEONG_INFO, UNSEONG_PHASE } from "./data";

interface Props {
  natal: NatalResult;
}

function getEnergyPattern(sibiUnseong: SibiUnseongInfo[]) {
  const strong = sibiUnseong.filter((u) => u.strength === "strong").length;
  const weak = sibiUnseong.filter((u) => u.strength === "weak").length;
  const mid = sibiUnseong.length - strong - weak;

  if (strong >= 3) return {
    image: "/kkachi/sibi_unseong/strong.png", title: "활동력 충만형", strong, mid, weak,
    desc: "활동력이 끊이지 않는 사주예요. 타고난 실력을 마음껏 발휘할 수 있고, 큰일에도 흔들리지 않는 추진력이 있는 타입입니다.",
  };
  if (weak >= 3) return {
    image: "/kkachi/sibi_unseong/deep.png", title: "깊이 승부형", strong, mid, weak,
    desc: "에너지를 안으로 모으는 인생이에요. 활동보다 사색·전문성·감수성으로 승부하는, 깊이 있는 타입이에요.",
  };
  if (strong > weak) return {
    image: "/kkachi/sibi_unseong/active.png", title: "활동력 우세형", strong, mid, weak,
    desc: "강한 시기가 더 많은 안정적인 흐름이에요. 꾸준히 성장하면서 성과를 쌓을 수 있는 타입입니다.",
  };
  if (weak > strong) return {
    image: "/kkachi/sibi_unseong/latebloomer.png", title: "후반에 빛나는 늦깎이형", strong, mid, weak,
    desc: "약한 시기가 깊이로 변하는 인생이에요. 의지로 밀어붙이기보단 환경·사람을 잘 활용해 후반전을 진짜로 만드는 타입이에요.",
  };
  return {
    image: "/kkachi/sibi_unseong/wave.png", title: "굴곡 있는 흐름형", strong, mid, weak,
    desc: "강함과 약함이 교차하며, 시기에 따라 컨디션 차이가 큰 타입이에요. 자기 사이클을 잘 읽으면 강할 때 밀어붙이고 약할 때 충전하기 좋아요.",
  };
}

function EnergyPatternCard({ sibiUnseong }: { sibiUnseong: SibiUnseongInfo[] }) {
  const { image, title, strong, mid, weak } = getEnergyPattern(sibiUnseong);
  const stats: { label: string; hanja: string; count: number }[] = [
    { label: "강", hanja: "强", count: strong },
    { label: "평", hanja: "平", count: mid },
    { label: "약", hanja: "弱", count: weak },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border-light)] p-4 space-y-2"
      style={{ backgroundColor: "var(--color-card)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">에너지 유형</p>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-muted)]">
          {stats.map(({ label, hanja, count }, i) => (
            <span key={label} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-[var(--color-ink-faint)]">·</span>}
              <span>{label}({hanja})</span>
              <strong className="text-[var(--color-ink)]">{count}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <img src={image} alt={title}
          className="w-2/3 aspect-[3/2] rounded-2xl object-cover"
          style={{ backgroundColor: "var(--color-ivory)" }} />
        <p className="text-base font-bold text-[var(--color-ink)] text-center">{title}</p>
      </div>
    </div>
  );
}

function LifeEnergyTable({
  sibiUnseong, pillars, pillarStemsKorean, pillarBranchesKorean,
}: {
  sibiUnseong: SibiUnseongInfo[];
  pillars: string[];
  pillarStemsKorean: string[];
  pillarBranchesKorean: string[];
}) {
  const PILLAR_ORDER: { key: string; label: string; idx: number }[] = [
    { key: "시주", label: "시주(時柱)", idx: 3 },
    { key: "일주", label: "일주(日柱)", idx: 2 },
    { key: "월주", label: "월주(月柱)", idx: 1 },
    { key: "년주", label: "년주(年柱)", idx: 0 },
  ];

  const cols = PILLAR_ORDER.map(({ key, label, idx }) => {
    const u = sibiUnseong.find((s) => s.pillar === key);
    const info = u ? UNSEONG_INFO[u.unseong_name] : null;
    const phase = info ? UNSEONG_PHASE[info.phase] : null;
    const pillar = pillars[idx] ?? "";
    const stem = pillar[0] ?? "";
    const branch = pillar[1] ?? "";
    return {
      key, label, isDay: key === "일주", u, info, phase,
      stem, branch,
      stemKor: pillarStemsKorean[idx] ?? "",
      branchKor: pillarBranchesKorean[idx] ?? "",
    };
  });

  return (
    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
      <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "72px" }} />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "var(--color-ivory)" }}>
            <th className="text-[10px] font-medium text-[var(--color-ink-faint)] py-1.5 px-2"></th>
            {cols.map(({ key, label, isDay }) => (
              <th key={key} className="text-[10px] font-semibold py-1.5 px-2"
                style={{
                  color: isDay ? "var(--color-gold)" : "var(--color-ink-muted)",
                  backgroundColor: isDay ? "var(--color-gold-faint)" : undefined,
                }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-1.5 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">천간(天干)</td>
            {cols.map(({ key, stem, stemKor }) => (
              <td key={key} className="py-1.5 px-2">
                <span className="font-heading text-sm font-bold leading-tight text-[var(--color-ink)]">
                  {stem ? `${stemKor}(${stem})` : "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-1.5 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">지지(地支)</td>
            {cols.map(({ key, branch, branchKor }) => (
              <td key={key} className="py-1.5 px-2">
                <span className="font-heading text-sm font-bold leading-tight text-[var(--color-ink)]">
                  {branch ? `${branchKor}(${branch})` : "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">운성(運星)</td>
            {cols.map(({ key, u, info, phase }) => (
              <td key={key} className="py-2 px-2">
                {u ? (
                  <div className="font-heading text-sm font-bold leading-tight"
                    style={{ color: phase?.color ?? "var(--color-ink)" }}>
                    {info?.korean ?? u.unseong_name}({u.unseong_name})
                  </div>
                ) : <span className="text-xs text-[var(--color-ink-faint)]">—</span>}
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)] align-top">특징</td>
            {cols.map(({ key, u, info, phase }) => (
              <td key={key} className="py-2 px-2 align-top">
                {u && info ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium leading-snug" style={{ color: phase?.color ?? "var(--color-ink-muted)" }}>
                      {info.tagline}
                    </div>
                    <div className="text-[9px] text-[var(--color-ink-faint)] leading-snug">
                      {info.desc}
                    </div>
                  </div>
                ) : <span className="text-xs text-[var(--color-ink-faint)]">—</span>}
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[10px] py-2 px-2 whitespace-nowrap text-left text-[var(--color-ink-faint)]">에너지</td>
            {cols.map(({ key, u }) => {
              if (!u) return <td key={key} className="py-2 px-2"><span className="text-xs text-[var(--color-ink-faint)]">—</span></td>;
              const label = u.strength === "strong" ? "강(强)" : u.strength === "weak" ? "약(弱)" : "평(平)";
              return (
                <td key={key} className="py-2 px-2">
                  <span className="text-xs font-bold text-[var(--color-ink)]">{label}</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function SibiUnseongSection({ natal }: Props) {
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="십이운성(十二運星)">
        인생의 <strong className="text-[var(--color-ink)]">생로병사 12단계 사이클</strong>이에요. 탄생(長生) → 절정(帝旺) → 쇠퇴(衰) → 잠듬(墓) → 다시 씨앗으로 돌아가는(胎) 흐름이죠.
        사주 4기둥(년·월·일·시)이 각각 어떤 단계인지 보면, <strong className="text-[var(--color-ink)]">인생 시기별 컨디션과 에너지 흐름</strong>이 한눈에 보입니다.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          사주 4기둥의 십이운성을 보면, <strong className="text-[var(--color-ink)]">인생의 큰 시기별 특징과 에너지</strong>를 짐작해볼 수 있어요.
        </KkachiTip>
        <LifeEnergyTable
          sibiUnseong={natal.sibi_unseong}
          pillars={natal.pillars}
          pillarStemsKorean={natal.pillar_stems_korean}
          pillarBranchesKorean={natal.pillar_branches_korean}
        />
        <KkachiTip>{natal.narratives.unseong_story}</KkachiTip>
        <EnergyPatternCard sibiUnseong={natal.sibi_unseong} />
        <KkachiTip>{getEnergyPattern(natal.sibi_unseong).desc}</KkachiTip>
      </div>
    </div>
  );
}
