import { Brain, CheckCircle } from 'lucide-react';

export default function PredictionConfidencePanel({ data }) {
  const confidenceColor = data.confidence >= 90 ? 'text-telesol-green' : 
                          data.confidence >= 70 ? 'text-telesol-orange' : 'text-telesol-red';

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Brain className="w-4 h-4 text-telesol-purple" />
        Prediction Confidence
      </h3>
      
      <div className="text-center mb-4">
        <div className={`text-4xl font-bold font-mono ${confidenceColor}`}>
          {data.confidence}%
        </div>
        <div className="text-xs text-gray-500 mt-1">Confidence Score</div>
      </div>
      
      {/* Confidence bar */}
      <div className="h-2 bg-telesol-bg rounded-full overflow-hidden mb-4">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${data.confidence}%`,
            backgroundColor: data.confidence >= 90 ? '#00FF88' : data.confidence >= 70 ? '#FF8C00' : '#FF4444'
          }}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-telesol-bg rounded p-2">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-telesol-green" />
            <span className="text-telesol-green">{data.modelAgreement}</span>
          </div>
          <div className="text-xs text-gray-500">Model Agreement</div>
        </div>
        <div className="bg-telesol-bg rounded p-2">
          <div className="text-telesol-cyan">{data.predictionWindow}</div>
          <div className="text-xs text-gray-500">Prediction Window</div>
        </div>
      </div>
    </div>
  );
}
