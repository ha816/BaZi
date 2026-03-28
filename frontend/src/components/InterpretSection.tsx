interface Props {
  title: string;
  lines: string[];
  variant?: "default" | "info" | "warning" | "success";
}

const STYLES: Record<string, string> = {
  default: "bg-white",
  info: "bg-blue-50 border-l-4 border-blue-400",
  warning: "bg-amber-50 border-l-4 border-amber-400",
  success: "bg-green-50 border-l-4 border-green-400",
};

export default function InterpretSection({
  title,
  lines,
  variant = "default",
}: Props) {
  if (lines.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-lg font-bold text-gray-800">{title}</h4>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed ${STYLES[variant]}`}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
