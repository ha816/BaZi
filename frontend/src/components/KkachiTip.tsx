interface Props {
  children: React.ReactNode;
}

export default function KkachiTip({ children }: Props) {
  return (
    <div className="flex items-start gap-2.5 pt-3 border-t border-[var(--color-border-light)]">
      <img
        src="/kkachi/normal_kkachi_00.png"
        alt="까치"
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        style={{ objectPosition: "50% 60%" }}
      />
      <div className="flex-1 bg-[var(--color-ivory)] rounded-xl rounded-tl-none px-3 py-2">
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
