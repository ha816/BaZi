interface Props {
  children: React.ReactNode;
  label?: string;
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="text-[var(--color-ink)]">{part.slice(2, -2)}</strong>
      : part
  );
}

export default function KkachiTip({ children, label }: Props) {
  const content = typeof children === "string" ? renderInline(children) : children;
  return (
    <div className="flex items-start gap-2.5">
      <img
        src="/kkachi/normal_kkachi_00.png"
        alt="까치"
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        style={{ objectPosition: "50% 60%" }}
      />
      <div className="flex-1 bg-[var(--color-ivory)] rounded-xl rounded-tl-none px-3 py-2">
        {label && <p className="text-[10px] font-semibold text-[var(--color-ink-faint)] mb-0.5">{label}</p>}
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
