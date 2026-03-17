import { Smartphone, Bluetooth, Signal } from 'lucide-react';

export default function DeviceDetectionMetrics({ data }) {
  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-telesol-purple" />
        Device Detection
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-telesol-bg rounded p-3 text-center">
          <div className="text-2xl font-bold text-telesol-cyan font-mono">
            {data.detectedDevices}
          </div>
          <div className="text-xs text-gray-500">Detected</div>
        </div>
        
        <div className="bg-telesol-bg rounded p-3 text-center">
          <div className="text-2xl font-bold text-telesol-green font-mono">
            {data.uniqueDevices}
          </div>
          <div className="text-xs text-gray-500">Unique</div>
        </div>
        
        <div className="bg-telesol-bg rounded p-3">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-white">{data.bluetoothSignals}</span>
          </div>
          <div className="text-xs text-gray-500">Bluetooth</div>
        </div>
        
        <div className="bg-telesol-bg rounded p-3">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-telesol-orange" />
            <span className="font-mono text-white">{data.avgSignalStrength} dBm</span>
          </div>
          <div className="text-xs text-gray-500">Avg Signal</div>
        </div>
      </div>
    </div>
  );
}
