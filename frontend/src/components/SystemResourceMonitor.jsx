import { Cpu, HardDrive, Zap, Database } from 'lucide-react';

export default function SystemResourceMonitor({ data, debugMode }) {
  const getUsageColor = (value, threshold = 80) => {
    if (value >= threshold) return 'bg-telesol-red';
    if (value >= threshold * 0.7) return 'bg-telesol-orange';
    return 'bg-telesol-green';
  };

  const resources = [
    { key: 'cpu', label: 'CPU', value: data.cpuUsage, unit: '%', icon: Cpu, isPercentage: true },
    { key: 'ram', label: 'RAM', value: data.ramUsage, unit: '%', icon: HardDrive, isPercentage: true },
    { key: 'api', label: 'API Latency', value: data.apiLatency, unit: 'ms', icon: Zap, isPercentage: false },
    { key: 'db', label: 'DB Writes', value: data.dbWriteRate, unit: '/s', icon: Database, isPercentage: false },
  ];

  return (
    <div className={`bg-telesol-card border rounded-lg p-4 ${debugMode ? 'border-telesol-orange debug-panel' : 'border-telesol-border'}`}>
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Cpu className="w-4 h-4 text-telesol-green" />
        System Resources
      </h3>
      
      <div className="space-y-3">
        {resources.map(({ key, label, value, unit, icon: Icon, isPercentage }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
              <span className="text-xs font-mono text-white">{value}{unit}</span>
            </div>
            {isPercentage && (
              <div className="h-1.5 bg-telesol-bg rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getUsageColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {debugMode && (
        <div className="mt-3 pt-3 border-t border-telesol-orange/30 text-xs font-mono text-gray-500">
          <div>UPTIME: 14d 7h 32m</div>
          <div>GC_CYCLES: 847</div>
        </div>
      )}
    </div>
  );
}
