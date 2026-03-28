interface Props {
  label: string;
  pillar: string;
}

export default function PillarCard({ label, pillar }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold tracking-widest text-gray-800">
        {pillar}
      </div>
    </div>
  );
}
