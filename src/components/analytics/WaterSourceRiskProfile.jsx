import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Droplets } from "lucide-react";

const RISK_COLORS = {
  high: "#dc2626",
  medium: "#f59e0b",
  low: "#16a34a",
};

// Assign risk based on water source type
const RISK_LEVELS = {
  "Drinking Water": "high",
  "Groundwater": "high",
  "River surface water": "medium",
  "Dam Water": "medium",
  "Wastewater": "high",
  "Marine-Coastal": "low",
  "Lake": "low",
  "Sediment": "medium",
  "Not specified": "low",
};

export default function WaterSourceRiskProfile({ papers }) {
  const { sourceData, seasonData, matrixData } = useMemo(() => {
    // Water source type distribution
    const sourceCounts = {};
    papers.forEach(paper => {
      const src = paper.water_source_type || "Not specified";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceData = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({
        source: source.length > 20 ? source.substring(0, 20) + "…" : source,
        fullSource: source,
        count,
        risk: RISK_LEVELS[source] || "low",
      }));

    // Season distribution
    const seasonCounts = {};
    papers.forEach(paper => {
      const s = paper.season || "Not specified";
      seasonCounts[s] = (seasonCounts[s] || 0) + 1;
    });
    const seasonData = Object.entries(seasonCounts)
      .filter(([s]) => s !== "Not specified")
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Sample matrix distribution
    const matrixCounts = {};
    papers.forEach(paper => {
      (paper.sample_matrix || []).forEach(m => {
        const key = m.length > 20 ? m.substring(0, 20) : m;
        matrixCounts[key] = (matrixCounts[key] || 0) + 1;
      });
    });
    const matrixData = Object.entries(matrixCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([matrix, count]) => ({ matrix, count }));

    return { sourceData, seasonData, matrixData };
  }, [papers]);

  const SEASON_COLORS = ["#0d9488", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#94a3b8"];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="w-5 h-5 text-teal-600" />
            Water Source Risk Profile
          </CardTitle>
          <p className="text-sm text-slate-500">Studies per water source type, colour-coded by contamination risk</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sourceData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="source" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v, n, p) => [v + " papers", p.payload.fullSource]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {sourceData.map((entry, i) => (
                  <Cell key={i} fill={RISK_COLORS[entry.risk]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> High Risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Medium Risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Lower Risk</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="border-0 shadow-sm flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Sampling Season Distribution</CardTitle>
            <p className="text-sm text-slate-500">When studies are typically conducted</p>
          </CardHeader>
          <CardContent>
            {seasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={seasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {seasonData.map((_, i) => <Cell key={i} fill={SEASON_COLORS[i % SEASON_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-sm">No season data available.</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Sample Matrix Types</CardTitle>
            <p className="text-sm text-slate-500">What is being sampled and tested</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={matrixData} margin={{ left: -10 }}>
                <XAxis dataKey="matrix" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}