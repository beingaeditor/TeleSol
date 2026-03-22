import { Brain, Clock, AlertTriangle } from 'lucide-react';

export default function CongestionPredictionCard({ forecast }) {
  const currentLoad = forecast[0]?.load || 0;
  const predictedLoad = forecast[forecast.length - 1]?.load || 0;
  const trend = predictedLoad - currentLoad;
  const willExceedThreshold = predictedLoad > 80;

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-telesol-purple" />
        <h3 className="text-sm text-gray-400 uppercase tracking-wide">AI Prediction</h3>
        <span className="ml-auto px-2 py-0.5 bg-telesol-purple/20 text-telesol-purple text-xs rounded">
          +10 min
        </span>
      </div>

      {/* Prediction Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Current</div>
          <div className="text-2xl font-bold text-telesol-cyan">{currentLoad}%</div>
        </div>
        
        <div className="flex-1 px-4">
          <div className="h-2 bg-telesol-bg rounded-full overflow-hidden relative">
            <div 
              className="absolute left-0 h-full bg-gradient-to-r from-telesol-cyan to-telesol-orange rounded-full transition-all"
              style={{ width: `${currentLoad}%` }}
            />
            <div 
              className="absolute h-full w-1 bg-telesol-red opacity-50"
              style={{ left: `${predictedLoad}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">0%</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Predicted</div>
          <div className={`text-2xl font-bold ${
            predictedLoad > 80 ? 'text-telesol-red' : 
            predictedLoad > 60 ? 'text-telesol-orange' : 
            'text-telesol-green'
          }`}>{predictedLoad}%</div>
        </div>
      </div>

      {/* Warning or Status */}
      {willExceedThreshold ? (
        <div className="p-3 bg-telesol-red/10 border border-telesol-red/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-telesol-red flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-telesol-red font-medium">
              High Load Expected
            </div>
            <div className="text-xs text-gray-400">
              Consider pre-activating backup capacity
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-telesol-green/10 border border-telesol-green/30 rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-telesol-green flex-shrink-0" />
          <div className="text-sm text-telesol-green">
            Network load within normal parameters
          </div>
        </div>
      )}

      {/* Trend Indicator */}
      <div className="mt-3 text-center">
        <span className={`text-xs ${trend > 10 ? 'text-telesol-red' : trend > 0 ? 'text-telesol-orange' : 'text-telesol-green'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% change predicted in 10 minutes
        </span>
      </div>
    </div>
  );
}
