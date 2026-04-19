interface Props {
  emoji?: string;
  title: string;
  free?: boolean;
  noMargin?: boolean;
}

export default function SectionHeader({ emoji, title, free, noMargin }: Props) {
  return (
    <div className={`flex items-center gap-2 ${noMargin ? "" : "mb-4"}`}>
      {emoji && <span className="text-base">{emoji}</span>}
      <h2 className="font-heading text-base font-bold text-[var(--color-ink)]">{title}</h2>
      {free !== undefined && (
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          free
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {free ? "무료" : "프리미엄"}
        </span>
      )}
    </div>
  );
}
