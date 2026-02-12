import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function FilteredTimeline({ papers, onYearClick }) {
  const data = useMemo(() => {
    const yearCounts = {};
    papers.forEach(paper => {
      const year = paper.publication_year;
      if (year) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    
    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [papers]);

  if (data.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-slate-900">{payload[0].payload.year}</p>
          <p className="text-sm text-slate-600">{payload[0].value} publication{payload[0].value !== 1 ? 's' : ''}</p>
          {onYearClick && (
            <button
              onClick={() => onYearClick(payload[0].payload.year)}
              className="mt-2 text-teal-600 hover:text-teal-700 text-xs font-medium"
            >
              Filter by {payload[0].payload.year} →
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Publication Trends (Filtered Results)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => value.toString()}
            />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#0d9488" 
              strokeWidth={3}
              dot={{ fill: '#0d9488', r: 4 }}
              activeDot={{ r: 6 }}
              onClick={(data) => {
                if (data && onYearClick) {
                  onYearClick(data.year);
                }
              }}
              className="cursor-pointer"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}