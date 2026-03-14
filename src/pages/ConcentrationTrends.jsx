import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Calendar } from "lucide-react";

export default function ConcentrationTrends() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCompound, setSelectedCompound] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['cec-records'],
    queryFn: () => base44.entities.CECRecord.list(),
  });

  // Process data for trends
  const { categories, compounds, provinces, trendData, compoundTrends, summary } = useMemo(() => {
    if (!records.length) return { categories: [], compounds: [], provinces: [], trendData: [], compoundTrends: [], summary: {} };

    // Extract unique values
    const cats = [...new Set(records.map(r => r.cec_category).filter(Boolean))].sort();
    const comps = [...new Set(records.map(r => r.contaminant_name).filter(Boolean))].sort();
    const provs = [...new Set(records.map(r => r.province).filter(Boolean))].sort();

    // Filter records
    let filtered = records.filter(r => 
      r.study_year && 
      r.concentration_numeric !== null && 
      r.concentration_numeric !== undefined &&
      !isNaN(r.concentration_numeric)
    );

    if (selectedCategory !== "all") {
      filtered = filtered.filter(r => r.cec_category === selectedCategory);
    }
    if (selectedCompound !== "all") {
      filtered = filtered.filter(r => r.contaminant_name === selectedCompound);
    }
    if (selectedProvince !== "all") {
      filtered = filtered.filter(r => r.province === selectedProvince);
    }

    // Calculate yearly averages
    const yearMap = {};
    filtered.forEach(r => {
      const year = r.study_year;
      if (!yearMap[year]) {
        yearMap[year] = { sum: 0, count: 0, records: [] };
      }
      yearMap[year].sum += r.concentration_numeric;
      yearMap[year].count += 1;
      yearMap[year].records.push(r);
    });

    const trends = Object.entries(yearMap)
      .map(([year, data]) => ({
        year: parseInt(year),
        avg_concentration: data.sum / data.count,
        count: data.count,
        min: Math.min(...data.records.map(r => r.concentration_numeric)),
        max: Math.max(...data.records.map(r => r.concentration_numeric)),
      }))
      .sort((a, b) => a.year - b.year);

    // Calculate compound-specific trends (top 10 by record count)
    const compoundMap = {};
    filtered.forEach(r => {
      const key = r.contaminant_name;
      if (!compoundMap[key]) {
        compoundMap[key] = {};
      }
      const year = r.study_year;
      if (!compoundMap[key][year]) {
        compoundMap[key][year] = { sum: 0, count: 0 };
      }
      compoundMap[key][year].sum += r.concentration_numeric;
      compoundMap[key][year].count += 1;
    });

    const compTrends = Object.entries(compoundMap)
      .map(([name, yearData]) => {
        const years = Object.entries(yearData)
          .map(([year, data]) => ({
            year: parseInt(year),
            avg: data.sum / data.count,
          }))
          .sort((a, b) => a.year - b.year);
        
        const totalRecords = Object.values(yearData).reduce((sum, d) => sum + d.count, 0);
        const trend = years.length >= 2 ? 
          (years[years.length - 1].avg - years[0].avg) / years[0].avg * 100 : 0;

        return { name, years, totalRecords, trend };
      })
      .sort((a, b) => b.totalRecords - a.totalRecords)
      .slice(0, 10);

    // Calculate summary statistics
    const summaryStats = {
      totalRecords: filtered.length,
      yearRange: trends.length > 0 ? `${trends[0].year}–${trends[trends.length - 1].year}` : "N/A",
      overallTrend: trends.length >= 2 ? 
        (trends[trends.length - 1].avg_concentration - trends[0].avg_concentration) / trends[0].avg_concentration * 100 : 0,
      increasing: compTrends.filter(c => c.trend > 5).length,
      decreasing: compTrends.filter(c => c.trend < -5).length,
      stable: compTrends.filter(c => c.trend >= -5 && c.trend <= 5).length,
    };

    return { categories: cats, compounds: comps, provinces: provs, trendData: trends, compoundTrends: compTrends, summary: summaryStats };
  }, [records, selectedCategory, selectedCompound, selectedProvince]);

  const getTrendIcon = (trendPercent) => {
    if (trendPercent > 5) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trendPercent < -5) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-blue-600" />;
  };

  const getTrendBadge = (trendPercent) => {
    if (trendPercent > 5) return <Badge className="bg-red-100 text-red-800 border-red-300">Increasing</Badge>;
    if (trendPercent < -5) return <Badge className="bg-green-100 text-green-800 border-green-300">Decreasing</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Stable</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading concentration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-slate-900">Concentration Trends Analysis</h1>
          </div>
          <p className="text-slate-600">
            Historical analysis of CEC concentration levels over time
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Filter Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-600 mb-2 block">CEC Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-600 mb-2 block">Compound</label>
                <Select value={selectedCompound} onValueChange={setSelectedCompound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Compounds</SelectItem>
                    {compounds.map(comp => (
                      <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-600 mb-2 block">Province</label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {provinces.map(prov => (
                      <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedCompound("all");
                    setSelectedProvince("all");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">{summary.totalRecords}</div>
              <div className="text-sm text-slate-600">Total Records</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">{summary.yearRange}</div>
              <div className="text-sm text-slate-600">Year Range</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {getTrendIcon(summary.overallTrend)}
                <div className="text-2xl font-bold text-slate-900">
                  {summary.overallTrend > 0 ? '+' : ''}{summary.overallTrend.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-slate-600">Overall Trend</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-red-100 text-red-800">{summary.increasing} ↑</Badge>
                <Badge className="bg-blue-100 text-blue-800">{summary.stable} →</Badge>
                <Badge className="bg-green-100 text-green-800">{summary.decreasing} ↓</Badge>
              </div>
              <div className="text-sm text-slate-600 mt-1">Compound Trends</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Average Concentration Over Time</CardTitle>
            <CardDescription>
              Year-over-year average concentration levels (ng/L or μg/L depending on compound)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: "#64748B", fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    label={{ value: 'Avg Concentration', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                    formatter={(value) => value.toFixed(2)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avg_concentration" 
                    stroke="#0D9488" 
                    strokeWidth={3}
                    name="Average Concentration"
                    dot={{ fill: '#0D9488', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>No concentration data available for the selected filters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compound-Specific Trends */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 10 Compounds by Trend</CardTitle>
            <CardDescription>
              Compounds with the most data showing concentration changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {compoundTrends.length > 0 ? (
              <div className="space-y-4">
                {compoundTrends.map((compound, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 mb-1">{compound.name}</div>
                        <div className="text-xs text-slate-600">{compound.totalRecords} records</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(compound.trend)}
                        {getTrendBadge(compound.trend)}
                        <span className="text-sm font-semibold text-slate-700">
                          {compound.trend > 0 ? '+' : ''}{compound.trend.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={compound.years}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fill: "#64748B", fontSize: 10 }}
                        />
                        <YAxis 
                          tick={{ fill: "#64748B", fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }}
                          formatter={(value) => value.toFixed(2)}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avg" 
                          stroke={compound.trend > 5 ? "#DC2626" : compound.trend < -5 ? "#16A34A" : "#2563EB"}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>No compound trends available for the selected filters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Distribution</CardTitle>
            <CardDescription>
              Number of compounds showing increasing, stable, or decreasing trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {compoundTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Increasing', count: summary.increasing, fill: '#DC2626' },
                  { category: 'Stable', count: summary.stable, fill: '#2563EB' },
                  { category: 'Decreasing', count: summary.decreasing, fill: '#16A34A' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="category" tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {[
                      { category: 'Increasing', count: summary.increasing, fill: '#DC2626' },
                      { category: 'Stable', count: summary.stable, fill: '#2563EB' },
                      { category: 'Decreasing', count: summary.decreasing, fill: '#16A34A' },
                    ].map((entry, index) => (
                      <Bar key={`bar-${index}`} dataKey="count" fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}