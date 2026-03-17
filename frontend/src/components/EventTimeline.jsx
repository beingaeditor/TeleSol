import { Clock, AlertTriangle, Brain, TrendingUp, Radio, Settings } from 'lucide-react';

export default function EventTimeline({ events, debugMode }) {
  const getEventIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-3 h-3 text-telesol-red" />;
      case 'prediction': return <Brain className="w-3 h-3 text-telesol-purple" />;
      case 'warning': return <TrendingUp className="w-3 h-3 text-telesol-orange" />;
      case 'detection': return <Radio className="w-3 h-3 text-telesol-cyan" />;
      case 'system': return <Settings className="w-3 h-3 text-gray-400" />;
      default: return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'alert': return 'border-telesol-red/50';
      case 'prediction': return 'border-telesol-purple/50';
      case 'warning': return 'border-telesol-orange/50';
      case 'detection': return 'border-telesol-cyan/50';
      default: return 'border-gray-600';
    }
  };

  return (
    <div className={`bg-telesol-card border rounded-lg p-4 ${debugMode ? 'border-telesol-orange debug-panel' : 'border-telesol-border'}`}>
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <Clock className="w-4 h-4 text-telesol-cyan" />
        Event Timeline
      </h3>
      
      <div className="event-timeline space-y-2">
        {events.map((event, index) => (
          <div 
            key={index}
            className={`flex items-start gap-2 p-2 rounded border-l-2 bg-telesol-bg ${getEventColor(event.type)}`}
          >
            <span className="text-xs text-gray-500 font-mono w-12 flex-shrink-0">
              {event.time}
            </span>
            <div className="flex items-center gap-2 flex-1">
              {getEventIcon(event.type)}
              <span className="text-sm text-gray-300">{event.event}</span>
            </div>
          </div>
        ))}
      </div>
      
      {debugMode && (
        <div className="mt-3 pt-3 border-t border-telesol-orange/30 text-xs font-mono text-gray-500">
          EVENT_BUFFER: {events.length} / 100
        </div>
      )}
    </div>
  );
}
