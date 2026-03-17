import { Cpu, Clock, Target, Zap } from 'lucide-react';

export default function AIModelStatusPanel({ data, debugMode }) {
  return (
    <div className={`bg-telesol-card border rounded-lg p-4 ${debugMode ? 'border-telesol-orange debug-panel' : 'border-telesol-border'}`}>
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Cpu className="w-4 h-4 text-telesol-purple" />
        AI Model Status
      </h3>
      
      {/* Model info */}
      <div className="bg-telesol-bg rounded p-3 mb-3">
        <div className="text-lg font-semibold text-telesol-cyan">
          {data.modelName} <span className="text-telesol-purple">{data.modelVersion}</span>
        </div>
      </div>
      
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-telesol-bg rounded p-2">
          <div className="flex items-center gap-1 text-telesol-orange">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{data.inferenceLatency}ms</span>
          </div>
          <div className="text-xs text-gray-500">Latency</div>
        </div>
        
        <div className="bg-telesol-bg rounded p-2">
          <div className="flex items-center gap-1 text-telesol-green">
            <Target className="w-3 h-3" />
            <span className="font-mono">{data.rollingAccuracy}%</span>
          </div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
        
        <div className="col-span-2 bg-telesol-bg rounded p-2">
          <div className="flex items-center gap-1 text-telesol-cyan">
            <Zap className="w-3 h-3" />
            <span className="font-mono">{data.predictionInterval}</span>
          </div>
          <div className="text-xs text-gray-500">Prediction Interval</div>
        </div>
      </div>
      
      {debugMode && (
        <div className="mt-3 pt-3 border-t border-telesol-orange/30 text-xs font-mono text-gray-500">
          <div>MODEL_HASH: 0x8f3a2c...</div>
          <div>LAST_TRAIN: 2025-03-15</div>
        </div>
      )}
    </div>
  );
}
