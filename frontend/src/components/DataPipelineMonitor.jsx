import { Database, Server, Layers, Gauge } from 'lucide-react';

export default function DataPipelineMonitor({ data, debugMode }) {
  const getStatusColor = (status) => {
    return status === 'healthy' ? 'text-telesol-green' : 
           status === 'degraded' ? 'text-telesol-orange' : 'text-telesol-red';
  };

  return (
    <div className={`bg-telesol-card border rounded-lg p-4 ${debugMode ? 'border-telesol-orange debug-panel' : 'border-telesol-border'}`}>
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Database className="w-4 h-4 text-telesol-cyan" />
        Data Pipeline
      </h3>
      
      <div className="space-y-3">
        {/* Packets per second */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Packets/sec</span>
          </div>
          <span className="font-mono text-telesol-cyan">{data.packetsPerSecond.toLocaleString()}</span>
        </div>
        
        {/* Ingestion status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Ingestion</span>
          </div>
          <span className={`font-mono capitalize ${getStatusColor(data.ingestionStatus)}`}>
            {data.ingestionStatus}
          </span>
        </div>
        
        {/* Queue size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Queue Size</span>
          </div>
          <span className={`font-mono ${data.queueSize > 50 ? 'text-telesol-orange' : 'text-telesol-green'}`}>
            {data.queueSize}
          </span>
        </div>
        
        {/* Server latency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Server Latency</span>
          </div>
          <span className={`font-mono ${data.serverLatency > 50 ? 'text-telesol-orange' : 'text-telesol-green'}`}>
            {data.serverLatency}ms
          </span>
        </div>
      </div>
      
      {debugMode && (
        <div className="mt-3 pt-3 border-t border-telesol-orange/30 text-xs font-mono text-gray-500">
          <div>KAFKA_LAG: 0</div>
          <div>REDIS_CONNS: 24</div>
        </div>
      )}
    </div>
  );
}
