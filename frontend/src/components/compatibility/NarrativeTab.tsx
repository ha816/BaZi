import ReactMarkdown from "react-markdown";
import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";

interface Props {
  narrative: string | null;
  streamingNarrative?: string;
  narrativeLoading?: boolean;
}

/** 까치 AI 종합해석 — 스트리밍 텍스트(없으면 캐시 narrative), Ollama 꺼짐 안내 */
export default function NarrativeTab({ narrative, streamingNarrative, narrativeLoading }: Props) {
  const text = streamingNarrative ?? narrative ?? "";
  const isLoading = narrativeLoading && !text;
  if (!text && !narrativeLoading) {
    return (
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader title="까치의 AI 종합해석" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          <KkachiTip>AI 종합해석은 까치 서버(Ollama)가 켜져 있을 때 제공돼요. 종합·영역별 궁합은 그대로 볼 수 있어요.</KkachiTip>
        </div>
      </div>
    );
  }
  return (
    <div className="slide-card">
      <div className="slide-card__header">
        <SectionHeader title="까치의 AI 종합해석" noMargin />
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>
          앞에서 본 데이터를 까치가 한 편의 글로 정리했어요. 강점·약점·실천 조언이 담겨 있어요.
        </KkachiTip>
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border-light)]" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[var(--color-gold)] animate-spin" />
            </div>
            <p className="text-sm text-[var(--color-ink-faint)] text-center">
              까치가 두 분의 관계를 풀어내고 있어요…
            </p>
          </div>
        ) : (
          <div className="prose-saju text-sm text-[var(--color-ink-light)] leading-relaxed">
            <ReactMarkdown>{text}</ReactMarkdown>
            {narrativeLoading && (
              <span className="animate-pulse text-[var(--color-ink-faint)]"> ▍</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
