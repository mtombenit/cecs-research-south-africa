import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin } from "lucide-react";

const COLORS = [
  "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4",
  "#0891b2", "#06b6d4", "#22d3ee", "#67e8f9"
];

export default function ProvinceDistribution({ papers }) {
  // Count papers by province
  const provinceData = papers.reduce((acc, paper) => {
    if (paper.province) {
      acc[paper.province] = (acc[paper.province] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = Object.entries(provinceData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-900">{payload[0].payload.name}</p>
          <p className="text-sm text-teal-600">
            {payload[0].value} {payload[0].value === 1 ? 'publication' : 'publications'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-teal-600" />
          Distribution by Province
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            <p>No province data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}