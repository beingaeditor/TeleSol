import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function LiveSensorDataPanel({ data, debugMode }) {
  const [liveData, setLiveData] = useState(data);
  
  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData({
        radarHumans: data.radarHumans + Math.floor(Math.random() * 10 - 5),
        wifiDevices: data.wifiDevices + Math.floor(Math.random() * 20 - 10),
        noiseLevel: (data.noiseLevel + (Math.random() * 4 - 2)).toFixed(1),
        distanceTriggers: data.distanceTriggers + Math.floor(Math.random() * 6 - 3),
        cameraPeopleCount: data.cameraPeopleCount + Math.floor(Math.random() * 8 - 4),
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [data]);

  const metrics = [
    { label: 'Radar humans', value: liveData.radarHumans, unit: '', color: 'text-telesol-cyan' },
    { label: 'WiFi devices', value: liveData.wifiDevices, unit: '', color: 'text-telesol-purple' },
    { label: 'Noise level', value: liveData.noiseLevel, unit: 'dB', color: 'text-telesol-orange' },
    { label: 'Distance triggers', value: liveData.distanceTriggers, unit: '/min', color: 'text-telesol-green' },
    { label: 'Camera people', value: liveData.cameraPeopleCount, unit: '', color: 'text-telesol-cyan' },
  ];

  return (
    <div className={`bg-telesol-card border rounded-lg p-4 ${debugMode ? 'border-telesol-orange debug-panel' : 'border-telesol-border'}`}>
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Activity className="w-4 h-4 text-telesol-green animate-pulse" />
        Live Sensor Data
        <span className="ml-auto w-2 h-2 bg-telesol-green rounded-full animate-pulse-live"></span>
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, unit, color }) => (
          <div key={label} className="bg-telesol-bg rounded p-2">
            <div className={`text-xl font-bold font-mono ${color}`}>
              {value}<span className="text-xs text-gray-500 ml-1">{unit}</span>
            </div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      
      {debugMode && (
        <div className="mt-3 pt-3 border-t border-telesol-orange/30 text-xs font-mono text-telesol-orange">
          RAW: {JSON.stringify(liveData)}
        </div>
      )}
    </div>
  );
}
