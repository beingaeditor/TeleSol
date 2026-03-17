import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TowerLoadForecast({ data }) {
  const currentLoad = data[0]?.load || 0;
  const predictedLoad = data[data.length - 1]?.load || 0;
  const trend = predictedLoad - currentLoad;

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-telesol-orange" />
        Load Forecast (+10 min)
      </h3>
      
      {/* Current vs Predicted */}
      <div className="flex justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500">Current</div>
          <div className="text-xl font-bold text-telesol-cyan">{currentLoad}%</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">+10 min</div>
          <div className={`text-xl font-bold ${predictedLoad > 80 ? 'text-telesol-red' : predictedLoad > 60 ? 'text-telesol-orange' : 'text-telesol-green'}`}>
            {predictedLoad}%
          </div>
        </div>
      </div>
      
      {/* Mini chart */}
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00D9FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#6B7280', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              hide
            />
            <ReferenceLine y={80} stroke="#FF4444" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="load"
              stroke="#00D9FF"
              fill="url(#loadGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Trend indicator */}
      <div className={`text-center text-sm mt-2 ${trend > 10 ? 'text-telesol-red' : trend > 0 ? 'text-telesol-orange' : 'text-telesol-green'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% in next 10 min
      </div>
    </div>
  );
}
