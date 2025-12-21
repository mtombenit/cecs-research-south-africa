import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

export default function YearTimeline({ papers }) {
  // Count papers by year
  const yearData = papers.reduce((acc, paper) => {
    if (paper.publication_year) {
      acc[paper.publication_year] = (acc[paper.publication_year] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = Object.entries(yearData)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-900">{payload[0].payload.year}</p>
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
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Publications Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="year" 
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => value.toString()}
              />
              <YAxis tick={{ fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#0d9488" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            <p>No publication data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}