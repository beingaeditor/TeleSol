export default function StatsCard({ label, value, unit, color = 'cyan' }) {
  const colorClasses = {
    cyan: 'text-telesol-cyan',
    green: 'text-telesol-green',
    orange: 'text-telesol-orange',
    red: 'text-telesol-red',
    white: 'text-white',
  };

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-lg ml-1">{unit}</span>}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}
