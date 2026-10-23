"use client";
import ReactMarkdown from "react-markdown";
import type { NatalResult, PostnatalResult, Summary } from "@/types/analysis";
import type { AiReportState } from "@/lib/useAiReport";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
  /** 페이지가 결과 직후 미리 시작해 들고 있는 스트림 — 없으면(옛 호출) 대기 표시만 */
  ai?: AiReportState;
}

// 글이 오는 동안 먼저 보여 주는 룰 엔진 요약(postnatal.summary) — 한눈에 탭을 되살리는 게 아니라 대기 화면에서만
const SUMMARY_ROWS: Array<[keyof Summary, string]> = [
  ["me", "나"], ["energy", "신살·운성"], ["yongshin", "용신·삼재"], ["timing", "택시"], ["year", "올해"],
  ["month", "이번 달"], ["today", "오늘"], ["caution", "조심"], ["zodiac", "십이지신"], ["fengshui", "풍수"],
];

// 한 줄 총평은 보여 주지 않는다(2026-10-23, 품질이 낮아 사용자 결정으로 제거) — 프롬프트에서 뺐고, 혹시 섞여 오는 줄은 떼어 버린다
const VERDICT_LINE = /^[ \t]*(?:[-*][ \t]*)?\*\*한 줄 총평\*\*[ \t]*[:：][ \t]*(.+)$/m;

function splitVerdict(text: string): { verdict: string; body: string } {
  const m = text.match(VERDICT_LINE);
  if (!m) return { verdict: "", body: text };
  const body = (text.slice(0, m.index) + text.slice((m.index ?? 0) + m[0].length)).replace(/\n[ \t]*-{3,}[ \t]*\n*$/, "\n").trimEnd();
  return { verdict: m[1].replace(/\*\*/g, "").trim(), body };
}

const RETRY_CLASS = "ml-1 px-2.5 py-1 rounded-lg border border-[var(--color-border-light)] text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors";

export default function AiTab({ postnatal, name, ai }: Props) {
  const rawText = ai?.text ?? "";
  const { body: text } = splitVerdict(rawText);
  const status = ai?.status ?? "idle";
  const waiting = (status === "idle" || status === "streaming") && !rawText;
  const summary = postnatal.summary;
  const rows = summary
    ? SUMMARY_ROWS.map(([key, label]) => [label, summary[key]] as const).filter(([, v]) => !!v)
    : [];

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <CollapsibleSectionHeader title="까치의 AI 사주 풀이">
          <p>
            {name ? `${name}님의 ` : ""}사주팔자·오행·용신·대운·세운 데이터를 까치가 한 편의 글로 풀어드려요.
          </p>
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-3">

          {status === "unavailable" && !text && (
            <p className="text-sm text-[var(--color-ink-faint)] leading-relaxed">
              AI 풀이는 까치 서버(Ollama)가 켜져 있을 때 제공돼요. 다른 탭의 풀이는 그대로 볼 수 있어요.
              <button type="button" onClick={ai?.onRetry} className={RETRY_CLASS}>다시 시도</button>
            </p>
          )}
          {status === "error" && !text && (
            <p className="text-sm text-[var(--color-ink-faint)] leading-relaxed">
              AI 풀이를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
              <button type="button" onClick={ai?.onRetry} className={RETRY_CLASS}>다시 시도</button>
            </p>
          )}

          {waiting && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1">
                <div className="relative w-8 h-8 shrink-0">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[var(--color-border-light)]" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-t-[var(--color-gold)] animate-spin" />
                </div>
                <p className="text-sm text-[var(--color-ink-faint)]">
                  까치가 사주를 풀어내고 있어요… 보통 1~2분 걸려요.
                </p>
              </div>
              {rows.length > 0 && (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-ivory-warm)] px-4 py-3">
                  <p className="text-xs font-semibold text-[var(--color-ink)]">글이 오는 동안 먼저 보는 요약</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--color-ink-light)] break-keep">
                    {rows.map(([label, value]) => (
                      <li key={label}>
                        <strong className="text-[var(--color-ink)]">{label}</strong> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {text && (
            <div className="prose-saju text-sm text-[var(--color-ink-light)] leading-relaxed">
              <ReactMarkdown>{text}</ReactMarkdown>
              {status === "streaming" && (
                <span className="animate-pulse text-[var(--color-ink-faint)]"> ▍</span>
              )}
            </div>
          )}
          {text && status === "error" && (
            <p className="text-xs text-[var(--color-ink-faint)]">
              글이 중간에 끊겼어요.
              <button type="button" onClick={ai?.onRetry} className={RETRY_CLASS}>다시 생성</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
