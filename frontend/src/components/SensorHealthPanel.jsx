import { Radio, Camera, Mic, Wifi, Ruler } from 'lucide-react';

export default function SensorHealthPanel({ data }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-telesol-green';
      case 'delayed': return 'bg-telesol-orange';
      case 'error': return 'bg-telesol-red';
      default: return 'bg-gray-500';
    }
  };

  const sensors = [
    { key: 'radar', label: 'Radar', icon: Radio, status: data.radar },
    { key: 'camera', label: 'Camera', icon: Camera, status: data.camera },
    { key: 'mic', label: 'Microphone', icon: Mic, status: data.mic },
    { key: 'wifiScanner', label: 'WiFi Scanner', icon: Wifi, status: data.wifiScanner },
    { key: 'tofSensor', label: 'ToF Sensor', icon: Ruler, status: data.tofSensor },
  ];

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Radio className="w-4 h-4 text-telesol-cyan" />
        Sensor Health
      </h3>
      
      <div className="space-y-2">
        {sensors.map(({ key, label, icon: Icon, status }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
              <span className="text-xs text-gray-400 capitalize">{status}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-telesol-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Last Update</span>
          <span className="text-telesol-green font-mono">{data.lastUpdate}</span>
        </div>
      </div>
    </div>
  );
}
