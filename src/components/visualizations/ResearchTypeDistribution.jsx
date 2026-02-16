import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { FileText } from "lucide-react";

const COLORS = [
  "#0d9488", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", 
  "#ec4899", "#f59e0b", "#10b981"
];

export default function ResearchTypeDistribution({ papers }) {
  // Count papers by research type
  const typeData = papers.reduce((acc, paper) => {
    if (paper.research_type) {
      acc[paper.research_type] = (acc[paper.research_type] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = Object.entries(typeData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-900">{payload[0].name}</p>
          <p className="text-sm text-teal-600">
            {payload[0].value} publications ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.08) return null; // Don't show label if less than 8%
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-teal-600" />
          Distribution by Research Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={450}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={130}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={60}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                layout="horizontal"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[450px] flex items-center justify-center text-slate-400">
            <p>No research type data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}