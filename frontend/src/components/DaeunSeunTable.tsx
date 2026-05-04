import { STEM_KOR, BRANCH_KOR } from "@/lib/ganji";

interface Props {
  pillars: string[];
  daeunGanji: string;
  seunGanji: string;
}

export default function DaeunSeunTable({ pillars, daeunGanji, seunGanji }: Props) {
  const cols = [
    { key: "년주", label: "년주", group: "natal" as const, stem: pillars[0]?.[0] ?? "", branch: pillars[0]?.[1] ?? "" },
    { key: "월주", label: "월주", group: "natal" as const, stem: pillars[1]?.[0] ?? "", branch: pillars[1]?.[1] ?? "" },
    { key: "일주", label: "일주", group: "natal" as const, stem: pillars[2]?.[0] ?? "", branch: pillars[2]?.[1] ?? "" },
    { key: "시주", label: "시주", group: "natal" as const, stem: pillars[3]?.[0] ?? "", branch: pillars[3]?.[1] ?? "" },
    { key: "대운", label: "대운", group: "un" as const, stem: daeunGanji[0] ?? "", branch: daeunGanji[1] ?? "" },
    { key: "세운", label: "세운", group: "un" as const, stem: seunGanji[0] ?? "", branch: seunGanji[1] ?? "" },
  ];
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
      <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--color-ivory)" }}>
            <th className="text-[9px] font-medium text-[var(--color-ink-faint)] py-1.5 px-1"></th>
            {cols.map(({ key, label, group }) => (
              <th key={key} className="text-[10px] font-semibold py-1.5 px-1"
                style={{
                  color: group === "un" ? "var(--color-gold)" : "var(--color-ink-muted)",
                  borderLeft: key === "대운" ? "1px dashed var(--color-border)" : undefined,
                }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">천간(天干)</td>
            {cols.map(({ key, stem }) => (
              <td key={key} className="py-1.5 px-1"
                style={{ borderLeft: key === "대운" ? "1px dashed var(--color-border)" : undefined }}>
                <span className="font-heading text-xs font-bold leading-tight text-[var(--color-ink)]">
                  {stem ? `${STEM_KOR[stem] ?? stem}(${stem})` : "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">지지(地支)</td>
            {cols.map(({ key, branch }) => (
              <td key={key} className="py-1.5 px-1"
                style={{ borderLeft: key === "대운" ? "1px dashed var(--color-border)" : undefined }}>
                <span className="font-heading text-xs font-bold leading-tight text-[var(--color-ink)]">
                  {branch ? `${BRANCH_KOR[branch] ?? branch}(${branch})` : "—"}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
