"use client";
import { useState } from "react";
import Image from "next/image";
import type { NatalResult, PostnatalResult } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";

const SAMJAE_STYLE: Record<string, { borderColor: string; labelColor: string; bgColor: string }> = {
  "눌삼재": { borderColor: "var(--color-fire)",  labelColor: "var(--color-fire)",  bgColor: "#F7EDEC" },
  "들삼재": { borderColor: "var(--color-earth)", labelColor: "var(--color-earth)", bgColor: "#F5F0E7" },
  "날삼재": { borderColor: "var(--color-earth)", labelColor: "var(--color-earth)", bgColor: "#F5F0E7" },
};

const SAMJAE_HANJA: Record<string, string> = {
  "들삼재": "入三災", "눌삼재": "訥三災", "날삼재": "出三災",
};

// 子(0)丑(1)寅(2)卯(3)辰(4)巳(5)午(6)未(7)申(8)酉(9)戌(10)亥(11) — base 2020(庚子)
// 백엔드 룰: 신자진생→寅卯辰, 인오술생→申酉戌, 사유축생→亥子丑, 해묘미생→巳午未
const SAMJAE_BY_BRANCH: { group: string; emoji: string; type: string; color: string; bg: string; border: string }[] = [
  { group: "사·유·축생", emoji: "🐍🐓🐂", type: "눌삼재", color: "var(--color-fire)",  bg: "#F7EDEC", border: "#E8C4C0" }, // 0 子
  { group: "사·유·축생", emoji: "🐍🐓🐂", type: "날삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 1 丑
  { group: "신·자·진생", emoji: "🐒🐭🐲", type: "들삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 2 寅
  { group: "신·자·진생", emoji: "🐒🐭🐲", type: "눌삼재", color: "var(--color-fire)",  bg: "#F7EDEC", border: "#E8C4C0" }, // 3 卯
  { group: "신·자·진생", emoji: "🐒🐭🐲", type: "날삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 4 辰
  { group: "해·묘·미생", emoji: "🐗🐰🐑", type: "들삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 5 巳
  { group: "해·묘·미생", emoji: "🐗🐰🐑", type: "눌삼재", color: "var(--color-fire)",  bg: "#F7EDEC", border: "#E8C4C0" }, // 6 午
  { group: "해·묘·미생", emoji: "🐗🐰🐑", type: "날삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 7 未
  { group: "인·오·술생", emoji: "🐯🐴🐕", type: "들삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 8 申
  { group: "인·오·술생", emoji: "🐯🐴🐕", type: "눌삼재", color: "var(--color-fire)",  bg: "#F7EDEC", border: "#E8C4C0" }, // 9 酉
  { group: "인·오·술생", emoji: "🐯🐴🐕", type: "날삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 10 戌
  { group: "사·유·축생", emoji: "🐍🐓🐂", type: "들삼재", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" }, // 11 亥
];

const GROUP_BRANCH_IDXS: Record<string, number[]> = {
  "인·오·술생": [8, 9, 10],  // 申酉戌년
  "사·유·축생": [11, 0, 1],  // 亥子丑년
  "신·자·진생": [2, 3, 4],   // 寅卯辰년
  "해·묘·미생": [5, 6, 7],   // 巳午未년
};


interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}


const BRANCH_KOR: Record<string, string> = {
  "子":"자","丑":"축","寅":"인","卯":"묘","辰":"진","巳":"사",
  "午":"오","未":"미","申":"신","酉":"유","戌":"술","亥":"해",
};

const BRANCH_TO_ZODIAC: Record<string, { kor: string; hanja: string }> = {
  "子": { kor: "쥐", hanja: "鼠" }, "丑": { kor: "소", hanja: "牛" },
  "寅": { kor: "호랑이", hanja: "虎" }, "卯": { kor: "토끼", hanja: "兎" },
  "辰": { kor: "용", hanja: "龍" }, "巳": { kor: "뱀", hanja: "蛇" },
  "午": { kor: "말", hanja: "馬" }, "未": { kor: "양", hanja: "羊" },
  "申": { kor: "원숭이", hanja: "猴" }, "酉": { kor: "닭", hanja: "鷄" },
  "戌": { kor: "개", hanja: "犬" }, "亥": { kor: "돼지", hanja: "猪" },
};

const BRANCH_TO_GROUP: Record<string, string> = {
  "寅": "인·오·술생", "午": "인·오·술생", "戌": "인·오·술생",
  "巳": "사·유·축생", "酉": "사·유·축생", "丑": "사·유·축생",
  "申": "신·자·진생", "子": "신·자·진생", "辰": "신·자·진생",
  "亥": "해·묘·미생", "卯": "해·묘·미생", "未": "해·묘·미생",
};

export default function SamjaeTab({ natal, postnatal }: Props) {
  const samjae = postnatal.samjae ?? null;
  const birthBranch = natal.pillars[0][1];
  const userGroup = BRANCH_TO_GROUP[birthBranch] ?? "";
  const branchIdxs = GROUP_BRANCH_IDXS[userGroup] ?? [];
  const firstBranchIdx = branchIdxs[0] ?? 0;
  const baseYear = 2020 + firstBranchIdx;
  const k = Math.floor((postnatal.year - baseYear) / 12);
  let cycle1Start = baseYear + k * 12;
  if (postnatal.year > cycle1Start + 2) cycle1Start += 12;
  const cycle2Start = cycle1Start + 12;
  const samjaeCycles = [
    [cycle1Start, cycle1Start + 1, cycle1Start + 2],
    [cycle2Start, cycle2Start + 1, cycle2Start + 2],
  ];
  const [showSamjae, setShowSamjae] = useState(false);

  return (
    <div className="space-y-4">
      {/* 삼재란 무엇인가 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">삼재(三災)</h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5 leading-relaxed">
            12년 주기로 찾아오는 3년간의 액운이에요. 수재(水災)·화재(火災)·풍재(風災) 세 가지 재앙이 겹친다고 하여 삼재라 불러요. 태어난 띠에 따라 삼재 시기가 정해져 있어요.
          </p>
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-4">

          {/* 3년 흐름 */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">삼재의 종류</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "들삼재", hanja: "入三災", desc: "삼재 시작\n큰 변화·결정 보류", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" },
                { type: "눌삼재", hanja: "訥三災", desc: "삼재 절정\n가장 조심해야 할 해", color: "var(--color-fire)",  bg: "#F7EDEC", border: "#E8C4C0" },
                { type: "날삼재", hanja: "出三災", desc: "삼재 마무리\n서서히 안정 회복", color: "var(--color-earth)", bg: "#F5F0E7", border: "#DDD0B8" },
              ].map(({ type, hanja, desc, color, bg, border }) => (
                <div key={type} className="rounded-lg p-3 text-center border" style={{ backgroundColor: bg, borderColor: border }}>
                  <p className="text-xs font-bold leading-tight" style={{ color }}>{type}({hanja})</p>
                  <p className="text-[10px] text-[var(--color-ink-faint)] leading-relaxed whitespace-pre-line mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>


      <div className="slide-card">
        <div className="slide-card__body">
          {!showSamjae ? (
            <button
              onClick={() => setShowSamjae(true)}
              className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
            >
              ⚡ 나의 삼재 확인하기
            </button>
          ) : samjae ? (() => {
            const s = SAMJAE_STYLE[samjae.type] ?? SAMJAE_STYLE["들삼재"];
            return (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: s.borderColor }}>
                  <div className="px-4 py-3" style={{ backgroundColor: s.bgColor, borderLeft: `4px solid ${s.borderColor}` }}>
                    <p className="text-sm font-bold" style={{ color: s.labelColor }}>
                      삼재(三災) — {samjae.type}({SAMJAE_HANJA[samjae.type] ?? ""})
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Image src="/kkachi/samjae.png" alt="삼재" width={240} height={240} className="object-contain w-1/2" />
                  </div>
                  <KkachiTip>
                    삼재는 반드시 나쁜 것만은 아니에요. 이 시기에 내실을 다지고 무리한 확장을 자제하면, 삼재가 끝난 후 더 큰 도약의 발판이 되기도 해요.
                  </KkachiTip>
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)]">개운법</p>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-[var(--color-wood)]">✓ 이렇게 해보세요</p>
                    {[
                      "적선(積善) — 봉사·기부·나눔으로 덕을 쌓으세요. 삼재 기운을 가장 효과적으로 누그러뜨려요.",
                      "낮은 자세 유지 — 자랑하거나 앞에 나서기보다 뒤에서 묵묵히 움직이는 것이 유리해요.",
                      "건강 관리 — 정기 검진, 충분한 수면, 과음·과로 자제로 몸의 기운을 보전하세요.",
                      "인연 돌보기 — 오래된 가족·친구와 가까이 지내면 삼재의 고립감을 줄여줘요.",
                    ].map((text, i) => (
                      <div key={i} className="flex gap-2 rounded-lg px-3 py-2 bg-[#EEF4F0] border border-[#C1D6C8]">
                        <span className="text-[var(--color-wood)] text-xs mt-0.5 flex-shrink-0">•</span>
                        <p className="text-xs text-[var(--color-ink-light)] leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-[var(--color-fire)]">✗ 이것은 피하세요</p>
                    {[
                      "큰 투자·사업 확장 — 새로운 리스크를 짊어지는 것은 삼재 기간에 특히 위험해요.",
                      "이사·결혼 등 생활 변화 — 가능하다면 삼재가 끝난 후로 미루는 것이 안전해요.",
                      "다툼·소송 — 분쟁이 생겼을 때 먼저 나서기보다 한발 물러나 조율하는 것이 좋아요.",
                    ].map((text, i) => (
                      <div key={i} className="flex gap-2 rounded-lg px-3 py-2 bg-[#F7EDEC] border border-[#E8C4C0]">
                        <span className="text-[var(--color-fire)] text-xs mt-0.5 flex-shrink-0">•</span>
                        <p className="text-xs text-[var(--color-ink-light)] leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-[var(--color-border-light)]">
                <div className="px-4 py-3" style={{ backgroundColor: "#EEF4F0", borderLeft: "4px solid var(--color-wood)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--color-wood)" }}>
                    삼재(三災) — 해당 없음
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Image src="/kkachi/no_samjae.png" alt="삼재 없음" width={240} height={240} className="object-contain w-1/2" />
              </div>
              <KkachiTip>
                올해는 삼재에 해당하지 않아요. 큰 재난이나 액운 없이 안정적으로 지낼 수 있어요.
              </KkachiTip>
            </div>
          )}
        </div>
      </div>

      {/* 띠별 삼재 주기 */}
      {showSamjae && <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">삼재 주기</h3>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
            {BRANCH_TO_ZODIAC[birthBranch]?.kor ?? ""}({BRANCH_TO_ZODIAC[birthBranch]?.hanja ?? birthBranch})의 연도별 삼재 — 12년마다 3년씩
          </p>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <div className="grid grid-cols-3 gap-2">
              {samjaeCycles[0].map((year) => {
                const branchIdx = ((year - 2020) % 12 + 12) % 12;
                const branch = "子丑寅卯辰巳午未申酉戌亥"[branchIdx];
                const data = SAMJAE_BY_BRANCH[branchIdx];
                const isCurrent = year === postnatal.year;
                return (
                  <div
                    key={year}
                    className="flex flex-col gap-1 rounded-lg px-2.5 py-2 border"
                    style={isCurrent
                      ? { backgroundColor: "var(--color-gold-faint)", borderColor: "var(--color-gold)" }
                      : { backgroundColor: "var(--color-ivory)", borderColor: "var(--color-border-light)" }
                    }
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-[var(--color-ink)]">{year}년 — {BRANCH_KOR[branch]}년({branch}年)</span>
                      {isCurrent && <span className="text-[9px] font-semibold text-[var(--color-gold)]">올해</span>}
                    </div>
                    <span
                      className="self-start text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ color: data.color, backgroundColor: data.bg, border: `1px solid ${data.border}` }}
                    >
                      {data.type}({SAMJAE_HANJA[data.type] ?? ""})
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>}
    </div>
  );
}
