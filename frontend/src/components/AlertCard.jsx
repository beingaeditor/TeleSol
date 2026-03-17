import { AlertTriangle } from 'lucide-react';
import { getCRSStatus } from '../data/mockData';

export default function AlertCard({ alert }) {
  const status = getCRSStatus(alert.crs);
  
  const severityColors = {
    critical: 'border-telesol-red bg-red-900/20',
    high: 'border-telesol-orange bg-orange-900/20',
    elevated: 'border-telesol-orange bg-orange-900/10',
  };

  return (
    <div
      className={`border rounded-lg p-4 ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold" style={{ color: status.color }}>
          {alert.zone} — CRS: {alert.crs}
        </h4>
        {alert.severity === 'critical' && (
          <AlertTriangle className="w-5 h-5 text-telesol-red" />
        )}
      </div>
      <p className="text-sm text-gray-300">{alert.action}</p>
    </div>
  );
}
