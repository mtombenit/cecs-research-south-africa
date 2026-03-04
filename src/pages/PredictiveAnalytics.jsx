import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Sparkles, AlertTriangle, Info, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";

export default function PredictiveAnalytics() {
  const [selectedCompound, setSelectedCompound] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [granularity, setGranularity] = useState("annual");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: papers = [] } = useQuery({
    queryKey: ["papers"],
    queryFn: () => base44.entities.ResearchPaper.list("-publication_year"),
  });

  // Collect all unique PFAS compounds
  const allCompounds = [...new Set(papers.flatMap(p => p.pfas_compounds || []))].sort();
  const allProvinces = ["Gauteng", "Western Cape", "Northern Cape", "Eastern Cape", "Mpumalanga", "Limpopo"];

  // Build historical data points from papers
  const getHistoricalData = () => {
    const filtered = papers.filter(p => {
      const hasCompound = selectedCompound ? p.pfas_compounds?.includes(selectedCompound) : true;
      const hasProvince = selectedProvince && selectedProvince !== "all" ? p.province === selectedProvince : true;
      return hasCompound && hasProvince && p.publication_year && p.concentrations_reported;
    });

    // Group by year, extract numeric concentration hints from text
    const byYear = {};
    filtered.forEach(p => {
      const year = p.publication_year;
      if (!byYear[year]) byYear[year] = { year, values: [], papers: 0 };
      byYear[year].papers++;
      // Try to extract a numeric value from concentration text
      const nums = (p.concentrations_reported || "").match(/[\d.]+/g);
      if (nums) {
        const vals = nums.map(Number).filter(n => n > 0 && n < 100000);
        byYear[year].values.push(...vals);
      }
    });

    return Object.values(byYear)
      .map(d => ({
        year: d.year,
        papers: d.papers,
        avg_concentration: d.values.length
          ? parseFloat((d.values.reduce((a, b) => a + b, 0) / d.values.length).toFixed(2))
          : null,
      }))
      .sort((a, b) => a.year - b.year);
  };

  const handleForecast = async () => {
    if (!selectedCompound) return;
    setLoading(true);
    setForecast(null);

    const historical = getHistoricalData();

    const isMonthly = granularity === "monthly";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an environmental data scientist. Based on the following historical research data for ${selectedCompound}${selectedProvince !== "all" ? ` in ${selectedProvince}` : " across South Africa"}, generate a concentration trend forecast.

Historical data points (publication year, number of papers, average reported concentration where available):
${JSON.stringify(historical, null, 2)}

Also consider general global trends: PFAS regulations tightening post-2020, South African awareness increasing, legacy contamination persisting.

Provide:
1. forecast_points: array of objects covering ONLY future ${isMonthly ? "months" : "years"} from ${isMonthly ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, "0")}` : new Date().getFullYear() + 1} to ${isMonthly ? `${new Date().getFullYear() + 3}-12` : "2030"} (one per ${isMonthly ? "month" : "year"}) with { ${isMonthly ? 'period: string (format "YYYY-MM")' : "year: number"}, predicted_concentration: number, confidence: "low"|"medium"|"high" }. Do NOT include ${isMonthly ? "months" : "years"} up to and including the current ${isMonthly ? "month" : "year"} — those are covered by actual historical data.
2. trend_direction: "increasing" | "decreasing" | "stable" | "uncertain"
3. trend_summary: 2-3 sentence plain English summary of the predicted trend and key drivers
4. key_factors: array of 3 short strings (factors influencing the forecast)
5. uncertainty_note: one sentence about data limitations`,
      response_json_schema: {
        type: "object",
        properties: {
          forecast_points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                year: { type: "number" },
                predicted_concentration: { type: "number" },
                confidence: { type: "string" }
              }
            }
          },
          trend_direction: { type: "string" },
          trend_summary: { type: "string" },
          key_factors: { type: "array", items: { type: "string" } },
          uncertainty_note: { type: "string" }
        }
      }
    });

    setForecast({ ...result, historical });
    setLoading(false);
  };

  // Merge historical + forecast for chart
  const chartData = forecast
    ? (() => {
        const map = {};
        (forecast.historical || []).forEach(d => {
          map[d.year] = { year: d.year, actual: d.avg_concentration, papers: d.papers };
        });
        (forecast.forecast_points || []).forEach(f => {
          if (!map[f.year]) map[f.year] = { year: f.year };
          map[f.year].forecast = f.predicted_concentration;
          map[f.year].confidence = f.confidence;
        });
        return Object.values(map).sort((a, b) => a.year - b.year);
      })()
    : [];

  const trendColors = {
    increasing: "bg-red-100 text-red-700",
    decreasing: "bg-green-100 text-green-700",
    stable: "bg-blue-100 text-blue-700",
    uncertain: "bg-yellow-100 text-yellow-700",
  };

  const currentYear = new Date().getFullYear();

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const lineH = 7;
    const pageH = doc.internal.pageSize.height;

    const checkPage = (needed = lineH) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Predictive Analytics Report", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`SA CECs Intelligent Portal  •  Generated: ${new Date().toLocaleDateString("en-ZA")}`, margin, y);
    y += lineH;
    doc.text(`Compound: ${selectedCompound}   |   Province: ${selectedProvince === "all" ? "All Provinces" : selectedProvince}`, margin, y);
    y += 10;
    doc.setTextColor(0);

    // Trend Summary
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Trend Summary", margin, y);
    y += lineH;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(forecast.trend_summary || "", 170);
    checkPage(summaryLines.length * lineH);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * lineH + 6;

    // Trend direction
    doc.setFont("helvetica", "bold");
    doc.text(`Trend Direction: `, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text((forecast.trend_direction || "").toUpperCase(), margin + 34, y);
    y += lineH + 6;

    // Key Drivers
    checkPage(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Key Drivers", margin, y);
    y += lineH;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    (forecast.key_factors || []).forEach(f => {
      checkPage();
      doc.text(`• ${f}`, margin + 4, y);
      y += lineH;
    });
    y += 4;

    // Historical Data
    checkPage(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Historical Data", margin, y);
    y += lineH;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Year", margin, y);
    doc.text("Avg Concentration", margin + 30, y);
    doc.text("Papers", margin + 90, y);
    y += lineH;
    doc.setFont("helvetica", "normal");
    (forecast.historical || []).forEach(d => {
      checkPage();
      doc.text(String(d.year), margin, y);
      doc.text(d.avg_concentration != null ? String(d.avg_concentration) : "N/A", margin + 30, y);
      doc.text(String(d.papers), margin + 90, y);
      y += lineH;
    });
    y += 4;

    // 5-Year Forecast
    checkPage(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("5-Year Forecast", margin, y);
    y += lineH;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Year", margin, y);
    doc.text("Predicted Concentration", margin + 30, y);
    doc.text("Confidence", margin + 100, y);
    y += lineH;
    doc.setFont("helvetica", "normal");
    (forecast.forecast_points || []).forEach(f => {
      checkPage();
      doc.text(String(f.year), margin, y);
      doc.text(f.predicted_concentration?.toFixed(2) ?? "N/A", margin + 30, y);
      doc.text(f.confidence || "", margin + 100, y);
      y += lineH;
    });
    y += 6;

    // Disclaimer
    checkPage(20);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont("helvetica", "italic");
    const disclaimer = doc.splitTextToSize(`Disclaimer: ${forecast.uncertainty_note} Forecasts are AI-generated from published research data and should not replace formal environmental assessments.`, 170);
    doc.text(disclaimer, margin, y);

    doc.save(`PredictiveReport_${selectedCompound}_${selectedProvince}_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md shadow-teal-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Predictive Analytics</h1>
          </div>
          <p className="text-slate-500 ml-14">
            AI-powered concentration trend forecasting for PFAS compounds based on historical South African research data.
          </p>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">PFAS Compound *</label>
                <Select value={selectedCompound} onValueChange={setSelectedCompound}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compound..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCompounds.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Forecast Granularity</label>
                <Select value={granularity} onValueChange={setGranularity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Province (optional)</label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="All provinces" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Provinces</SelectItem>
                    {allProvinces.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleForecast}
                disabled={!selectedCompound || loading}
                className="bg-teal-600 hover:bg-teal-700 h-10"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Forecast...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Forecast</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {forecast && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm sm:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-slate-900">Trend Forecast</p>
                        {forecast.trend_direction && (
                          <Badge className={`${trendColors[forecast.trend_direction]} border-0 capitalize`}>
                            {forecast.trend_direction}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{forecast.trend_summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Key Drivers</p>
                  <ul className="space-y-2">
                    {forecast.key_factors?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-teal-500 font-bold mt-0.5">→</span> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  {selectedCompound} Concentration Trend — 2010 to 2030
                  {selectedProvince !== "all" && ` (${selectedProvince})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: "Conc. (avg, units vary)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11 } }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value, name) => [value?.toFixed ? value.toFixed(2) : value, name === "actual" ? "Actual" : "Forecast"]}
                    />
                    <Legend />
                    <ReferenceLine x={currentYear} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Now", position: "top", fontSize: 11, fill: "#94a3b8" }} />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#0d9488" }}
                      connectNulls
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                      dot={{ r: 4, fill: "#f59e0b" }}
                      connectNulls
                      name="AI Forecast"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Forecast table */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Forecast Points (2010–2030)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-600 font-medium">Year</th>
                        <th className="text-left py-2 text-slate-600 font-medium">Predicted Concentration</th>
                        <th className="text-left py-2 text-slate-600 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.forecast_points?.map((f, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2.5 font-medium text-slate-900">{f.year}</td>
                          <td className="py-2.5 text-slate-700">{f.predicted_concentration?.toFixed(2)}</td>
                          <td className="py-2.5">
                            <Badge className={
                              f.confidence === "high" ? "bg-green-100 text-green-700 border-0" :
                              f.confidence === "medium" ? "bg-yellow-100 text-yellow-700 border-0" :
                              "bg-slate-100 text-slate-600 border-0"
                            }>
                              {f.confidence}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer + Download */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg p-4 flex-1">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p><strong>Disclaimer:</strong> {forecast.uncertainty_note} Forecasts are AI-generated from published research data and should not replace formal environmental assessments.</p>
              </div>
              <Button onClick={handleDownloadReport} className="bg-teal-600 hover:bg-teal-700 flex-shrink-0">
                <Download className="w-4 h-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!forecast && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a compound to begin</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Choose a PFAS compound and optionally a province, then generate an AI-powered 5-year concentration forecast based on historical research data.
            </p>
            {allCompounds.length === 0 && (
              <div className="flex items-center gap-2 mt-4 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                <Info className="w-4 h-4" />
                No PFAS compound data found in the database yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}