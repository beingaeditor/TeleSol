import { getCRSStatus } from '../data/mockData';

export default function ZoneChart({ data }) {
  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">Zone Comparison</h3>
      <div className="space-y-3">
        {data.map((zone) => {
          const status = getCRSStatus(zone.crs);
          return (
            <div key={zone.name} className="flex items-center gap-3">
              <span className="w-12 text-sm text-gray-300">{zone.name}</span>
              <div className="flex-1 h-6 bg-telesol-bg rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${zone.crs}%`,
                    backgroundColor: status.color,
                  }}
                />
              </div>
              <span
                className="w-10 text-right font-mono font-bold"
                style={{ color: status.color }}
              >
                {zone.crs}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
