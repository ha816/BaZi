import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo, ganjiToElements } from "@/lib/elementColors";
import KkachiTip from "@/components/KkachiTip";

const GANJI_60 = [
  "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
  "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
  "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
  "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
  "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
  "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥",
];

const SIPSIN_MEANING: Record<string, string> = {
  "比肩": "나와 같은 에너지가 들어오는 시기예요. 독립심과 자아가 강해지고, 주체적으로 길을 개척하게 돼요.",
  "劫財": "경쟁과 나눔의 기운이에요. 협력하면 힘이 되지만, 재물이 새는 흐름도 있으니 지출을 점검해 봐요.",
  "食神": "재능이 빛나고 먹을 복이 따르는 시기예요. 하고 싶은 것을 표현하고 베풀수록 더 많이 돌아와요.",
  "傷官": "창의력과 개성이 폭발하는 시기예요. 틀을 깨는 에너지가 강하지만, 조직 내 마찰은 주의해야 해요.",
  "偏財": "적극적인 재물 운이 따르는 시기예요. 투자·사업·새로운 기회에 민감하게 반응하면 좋아요.",
  "正財": "안정적인 수입과 저축의 기운이에요. 꾸준히 성실하게 쌓아가면 재물이 단단해져요.",
  "偏官": "강한 자극과 도전이 오는 시기예요. 압박감이 있지만 그 안에 성장의 기회가 숨어 있어요.",
  "正官": "명예와 책임의 기운이에요. 사회적 인정을 받거나 직책·역할의 변화가 찾아올 수 있어요.",
  "偏印": "직관과 학문의 기운이에요. 공부·연구·자기계발에 집중하기 좋고, 전문성이 쌓이는 시기예요.",
  "正印": "배움과 보호의 기운이에요. 어른이나 스승의 도움을 받을 수 있고, 마음이 안정되는 시기예요.",
};

const SIPSIN_DERIVE: Record<string, { rel: string; yinyang: string; relColor: string }> = {
  "比肩": { rel: "같은 오행",   yinyang: "일치", relColor: "#78716C" },
  "劫財": { rel: "같은 오행",   yinyang: "다름", relColor: "#78716C" },
  "食神": { rel: "내가 도움",   yinyang: "일치", relColor: "#1B6B3A" },
  "傷官": { rel: "내가 도움",   yinyang: "다름", relColor: "#1B6B3A" },
  "偏財": { rel: "내가 억제", yinyang: "일치", relColor: "#C0392B" },
  "正財": { rel: "내가 억제", yinyang: "다름", relColor: "#C0392B" },
  "偏官": { rel: "나를 억제", yinyang: "일치", relColor: "#C0392B" },
  "正官": { rel: "나를 억제", yinyang: "다름", relColor: "#C0392B" },
  "偏印": { rel: "나를 도움",   yinyang: "일치", relColor: "#1B6B3A" },
  "正印": { rel: "나를 도움",   yinyang: "다름", relColor: "#1B6B3A" },
};

const OHAENG_IDX: Record<string, number> = { '木':0, '火':1, '土':2, '金':3, '水':4 };
const OHAENG_KOR = ['나무','불','흙','쇠','물'];
const OHAENG_COLORS = ['#1B6B3A','#B02020','#8A4F00','#3D3D3D','#0F4F8A'];
const OHAENG_BGS = ['#C8E6D4','#F8CCC8','#F5DCAA','#E0E0E0','#C4DDF5'];
const OHAENG_BORDERS = ['#6DB890','#E07070','#D4A060','#A0A0A0','#6AAAD8'];
const SAENG_PAIRS: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
const GEUK_PAIRS: [number, number][] = [[0,2],[1,3],[2,4],[3,0],[4,1]];

function OhaengDiagram({ myElement, daeunStemElement, daeunBranchElement, label = "대운" }: {
  myElement: string; daeunStemElement: string; daeunBranchElement: string; label?: string;
}) {
  const CX = 100, CY = 88, PR = 66, NR = 20;
  function pentaPos(i: number): [number, number] {
    const a = (-90 + i * 72) * Math.PI / 180;
    return [CX + PR * Math.cos(a), CY + PR * Math.sin(a)];
  }
  function arrowSeg(i1: number, i2: number) {
    const [x1,y1] = pentaPos(i1), [x2,y2] = pentaPos(i2);
    const dx = x2-x1, dy = y2-y1, l = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/l, uy = dy/l;
    return { x1: x1+NR*ux, y1: y1+NR*uy, x2: x2-(NR+4)*ux, y2: y2-(NR+4)*uy };
  }

  const myIdx = OHAENG_IDX[myElement] ?? -1;
  const stemIdx = OHAENG_IDX[daeunStemElement] ?? -1;
  const branchIdx = OHAENG_IDX[daeunBranchElement] ?? -1;

  function isHi(a: number, b: number) {
    return (a === myIdx && (b === stemIdx || b === branchIdx)) ||
           ((a === stemIdx || a === branchIdx) && b === myIdx);
  }

  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] p-3">
      <p className="text-[10px] font-semibold text-[var(--color-ink-muted)] mb-2">{label} 오행 관계도</p>
      <svg viewBox="0 0 200 182" className="w-2/3 mx-auto block">
        <defs>
          <marker id="oa-saeng" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#1B6B3A" opacity="0.7" />
          </marker>
          <marker id="oa-geuk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#C0392B" opacity="0.6" />
          </marker>
        </defs>
        {SAENG_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          const hi = isHi(a,b);
          return <line key={`s${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#1B6B3A" strokeWidth={hi?3:1.2} strokeOpacity={hi?1:0.2} markerEnd="url(#oa-saeng)" />;
        })}
        {GEUK_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          const hi = isHi(a,b);
          return <line key={`g${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#C0392B" strokeWidth={hi?3:1} strokeOpacity={hi?0.9:0.15}
            strokeDasharray={hi?undefined:"4,3"} markerEnd="url(#oa-geuk)" />;
        })}
        {['木','火','土','金','水'].map((elem, i) => {
          const [x,y] = pentaPos(i);
          const isMe = i === myIdx;
          const isStem = i === stemIdx;
          const isBranch = i === branchIdx;
          const active = isMe || isStem || isBranch;
          const nodeLabel = isMe && isStem && isBranch ? '나=천간·지지'
            : isMe && isStem ? '나=천간' : isMe && isBranch ? '나=지지'
            : isStem && isBranch ? '천간·지지'
            : isMe ? '나' : isStem ? '천간' : isBranch ? '지지' : null;
          return (
            <g key={elem}>
              <circle cx={x} cy={y} r={NR}
                fill={active ? OHAENG_BGS[i] : '#F5F2EC'}
                stroke={OHAENG_BORDERS[i]}
                strokeWidth={active?2.5:1} opacity={active?1:0.45} />
              <text x={x} y={y-3} textAnchor="middle" dominantBaseline="middle"
                fontSize={active?16:13} fontWeight={active?700:400}
                fill={OHAENG_COLORS[i]} opacity={active?1:0.4}
                style={{ fontFamily: "serif" }}>
                {elem}
              </text>
              <text x={x} y={y+9} textAnchor="middle" dominantBaseline="middle"
                fontSize={8.5} fill={OHAENG_COLORS[i]} opacity={active?0.85:0.35}>
                {OHAENG_KOR[i]}
              </text>
              {nodeLabel && (
                <text x={x} y={y+NR+11} textAnchor="middle"
                  fontSize={8} fontWeight={700}
                  fill={isMe ? '#8A4F00' : OHAENG_COLORS[i]}>
                  {nodeLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 mt-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-[2px] bg-[#1B6B3A] rounded" />
          <span className="text-xs text-[var(--color-ink-muted)]">生 — 도움</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-[#C0392B]" />
          <span className="text-xs text-[var(--color-ink-muted)]">剋 — 억제</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function SeunTab({ natal, postnatal }: Props) {
  const seunEls = ganjiToElements(postnatal.seun_ganji);

  return (
    <div className="space-y-4">
      {/* 세운(歲運) 섹션 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">세운(歲運)</h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5 leading-relaxed">개인 사주와 무관하게 연도만으로 정해지며, 모든 사람이 같은 기운을 맞이해요.<br />대운이 10년 주기의 큰 흐름이라면, 세운은 1년 단위의 잔물결이에요.</p>
            </div>
            {postnatal.yongshin_in_seun && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#EEF4F0", color: "var(--color-wood)", border: "1px solid #C1D6C8" }}>
                용신 포함 ✓
              </span>
            )}
          </div>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          {/* 4년 세운 그리드 */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {Array.from({ length: 3 }, (_, i) => postnatal.year + i).map((year) => {
              const ganji = GANJI_60[(year - 4) % 60];
              const els = ganjiToElements(ganji);
              const si = getElementInfo(els.stem);
              const bi = getElementInfo(els.branch);
              const isCurrent = year === postnatal.year;
              return (
                <div key={year} className={`rounded-xl px-1.5 py-2.5 text-center border ${
                  isCurrent
                    ? "border-[var(--color-gold)] bg-[var(--color-gold-faint)]"
                    : "border-[var(--color-border-light)] bg-[var(--color-card)]"
                }`}>
                  <div className="text-[10px] text-[var(--color-ink-faint)] mb-1">{year}</div>
                  <div className="flex justify-center gap-0.5 mb-0.5">
                    <span className="font-heading text-sm font-bold" style={{ color: si.color }}>{ganji[0]}</span>
                    <span className="font-heading text-sm font-bold" style={{ color: bi.color }}>{ganji[1]}</span>
                  </div>
                  <div className="text-[9px] text-[var(--color-ink-faint)]">{si.korean}</div>
                  {isCurrent && <div className="text-[9px] font-semibold mt-1 text-[var(--color-gold)]">올해</div>}
                </div>
              );
            })}
          </div>

          {/* 세운 오행 관계도 */}
          <OhaengDiagram
            myElement={natal.my_element.name}
            daeunStemElement={seunEls.stem}
            daeunBranchElement={seunEls.branch}
            label="세운"
          />

          {/* 천간/지지 카드 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "천간(天干)", sipsin: postnatal.seun_stem },
              { label: "지지(地支)", sipsin: postnatal.seun_branch },
            ].map(({ label, sipsin }) => {
              const info = getElementInfo(sipsin.element);
              const d = SIPSIN_DERIVE[sipsin.sipsin_name];
              const myInfo = getElementInfo(natal.my_element.name);
              const myYY = natal.day_stem_yin_yang;
              const tgtYY = d ? (d.yinyang === "일치" ? myYY : (myYY === "양" ? "음" : "양")) : "";
              return (
                <div key={label}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-3 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-[var(--color-ink-faint)]">{label}</span>
                  {d && (
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                            style={{ backgroundColor: myInfo.bgColor, border: `1.5px solid ${myInfo.borderColor}` }}>
                            <span className="font-heading text-base font-bold leading-none" style={{ color: myInfo.color }}>{natal.day_stem}</span>
                            <span className="text-[8px] mt-0.5" style={{ color: myInfo.color }}>{myInfo.korean}</span>
                          </div>
                          <span className="text-[8px] text-[var(--color-ink-faint)]">{myYY}</span>
                        </div>
                        <div className="flex items-center pb-4">
                          <span className="text-base font-bold" style={{ color: d.relColor }}>
                            {d.rel.startsWith("나를") ? "←" : "→"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                            style={{ backgroundColor: info.bgColor, border: `1.5px solid ${info.borderColor}` }}>
                            <span className="font-heading text-base font-bold leading-none" style={{ color: info.color }}>{sipsin.char}</span>
                            <span className="text-[8px] mt-0.5" style={{ color: info.color }}>{info.korean}</span>
                          </div>
                          <span className="text-[8px] text-[var(--color-ink-faint)]">{tgtYY}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-center font-medium">
                        <span style={{ color: d.relColor }}>{d.rel}</span>
                        <span className="text-[var(--color-ink)]"> · 음양 {d.yinyang}</span>
                      </p>
                    </div>
                  )}
                  <div className="w-full pt-1.5 border-t border-[var(--color-border-light)] text-center space-y-0.5 mt-0.5">
                    <p className="font-heading text-base font-bold text-[var(--color-gold)]">{sipsin.sipsin_name}</p>
                    <p className="text-[10px] text-[var(--color-ink-faint)] leading-tight">{sipsin.domain}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 세운 십신 해석 */}
          {(() => {
            const stemSame = postnatal.seun_stem.sipsin_name === postnatal.seun_branch.sipsin_name;
            return (
              <div className="space-y-1">
                {stemSame ? (
                  <KkachiTip label={`천간·지지 십신 · ${postnatal.seun_stem.sipsin_name} (${postnatal.seun_stem.domain})`}>
                    {SIPSIN_MEANING[postnatal.seun_stem.sipsin_name] ?? postnatal.seun_stem.domain}
                  </KkachiTip>
                ) : (
                  <>
                    <KkachiTip label={`천간 십신 · ${postnatal.seun_stem.sipsin_name} (${postnatal.seun_stem.domain})`}>
                      {SIPSIN_MEANING[postnatal.seun_stem.sipsin_name] ?? postnatal.seun_stem.domain}
                    </KkachiTip>
                    <KkachiTip label={`지지 십신 · ${postnatal.seun_branch.sipsin_name} (${postnatal.seun_branch.domain})`}>
                      {SIPSIN_MEANING[postnatal.seun_branch.sipsin_name] ?? postnatal.seun_branch.domain}
                    </KkachiTip>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
