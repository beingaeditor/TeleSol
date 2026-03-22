import { Activity, Wifi, TrendingUp, TrendingDown } from 'lucide-react';

export default function NetworkHealthCard({ data }) {
  const healthScore = Math.round(100 - data.riskScore);
  const healthColor = healthScore >= 70 ? 'telesol-green' : healthScore >= 50 ? 'telesol-orange' : 'telesol-red';
  
  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className={`w-5 h-5 text-${healthColor}`} />
        <h3 className="text-sm text-gray-400 uppercase tracking-wide">Network Health</h3>
      </div>

      {/* Health Score Circle */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="#1A2332"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke={healthScore >= 70 ? '#00FF88' : healthScore >= 50 ? '#FF8C00' : '#FF4444'}
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${healthScore * 2.2} 220`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold text-${healthColor}`}>{healthScore}%</span>
          </div>
        </div>

        <div className="flex-1 ml-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Utilization</span>
            <span className="text-white font-mono">{data.networkUtil}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Risk Level</span>
            <span className={`font-mono text-${healthColor}`}>{data.riskScore}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Devices</span>
            <span className="text-white font-mono">{data.activeDevices.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`p-2 rounded-lg bg-${healthColor}/10 border border-${healthColor}/30 text-center`}>
        <span className={`text-sm text-${healthColor} font-medium`}>
          {healthScore >= 70 ? '✓ Network Operating Normally' : 
           healthScore >= 50 ? '⚠ Elevated Load Detected' : 
           '⚠ Critical Attention Required'}
        </span>
      </div>
    </div>
  );
}
