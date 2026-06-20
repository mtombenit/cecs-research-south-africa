import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

const WATER_TYPES = ["River surface water", "Groundwater", "Drinking Water", "Wastewater", "Dam Water"];
const COLORS = { "River surface water": "#0d9488", "Groundwater": "#2563eb", "Drinking Water": "#7c3aed", "Wastewater": "#dc2626", "Dam Water": "#d97706" };

export default function LongitudinalTrends({ papers }) {
  const { yearlyData, researchGrowth } = useMemo(() => {
    const byYear = {};

    papers.forEach(paper => {
      const year = paper.publication_year;
      if (!year || year < 1990 || year > 2030) return;
      if (!byYear[year]) byYear[year] = { year, total: 0 };
      WATER_TYPES.forEach(wt => {
        if (!byYear[year][wt]) byYear[year][wt] = 0;
      });
      byYear[year].total++;
      if (paper.water_source_type && byYear[year][paper.water_source_type] !== undefined) {
        byYear[year][paper.water_source_type]++;
      }
    });

    const yearlyData = Object.values(byYear).sort((a, b) => a.year - b.year);

    // Research type growth over time
    const typeByYear = {};
    papers.forEach(paper => {
      const year = paper.publication_year;
      const rt = paper.research_type;
      if (!year || year < 1990 || year > 2030 || !rt) return;
      const normalizedRt = rt.includes("Environmental Monitoring") ? "Env. Monitoring"
        : rt.includes("Review") ? "Review"
        : rt.includes("Risk") ? "Risk Assessment"
        : rt.includes("Water Quality") ? "Water Quality"
        : rt.includes("Treatment") ? "Treatment Tech"
        : "Other";
      if (!typeByYear[year]) typeByYear[year] = { year };
      typeByYear[year][normalizedRt] = (typeByYear[year][normalizedRt] || 0) + 1;
    });
    const researchGrowth = Object.values(typeByYear).sort((a, b) => a.year - b.year);

    return { yearlyData, researchGrowth };
  }, [papers]);

  const rtColors = { "Env. Monitoring": "#0d9488", "Review": "#7c3aed", "Risk Assessment": "#dc2626", "Water Quality": "#2563eb", "Treatment Tech": "#d97706", "Other": "#94a3b8" };
  const rtKeys = ["Env. Monitoring", "Review", "Risk Assessment", "Water Quality", "Treatment Tech", "Other"];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Publication Volume Over Time</CardTitle>
          <p className="text-sm text-slate-500">Annual research output trend</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={yearlyData} margin={{ right: 10 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#0d9488" fill="url(#totalGrad)" strokeWidth={2} name="Total Papers" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Research Type Evolution</CardTitle>
          <p className="text-sm text-slate-500">How research focus has shifted over time</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={researchGrowth} margin={{ right: 10 }}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {rtKeys.map(rt => (
                <Line key={rt} type="monotone" dataKey={rt} stroke={rtColors[rt]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}