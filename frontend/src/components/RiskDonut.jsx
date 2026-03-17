import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function RiskDonut({ data }) {
  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Risk Distribution</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-xs mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-400">{item.name} {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
