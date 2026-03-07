import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, MapPin, Beaker, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import ARCWRCKnowledgeHub from "@/components/wrc/ARCWRCKnowledgeHub";

const COLORS = ['#0d9488', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState("insights");
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });

  const togglePaper = (paperId) => {
    setSelectedPapers(prev => 
      prev.includes(paperId) ? prev.filter(id => id !== paperId) : [...prev, paperId]
    );
  };

  const selectAll = () => {
    setSelectedPapers(papers.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPapers([]);
  };

  const generateAnalysis = async () => {
    if (selectedPapers.length === 0) {
      toast.error("Please select at least one paper");
      return;
    }

    setIsAnalyzing(true);
    try {
      const selectedData = papers.filter(p => selectedPapers.includes(p.id));
      
      // Prepare data summary for AI
      const dataSummary = selectedData.map(p => ({
        title: p.title,
        year: p.publication_year,
        province: p.province,
        research_type: p.research_type,
        compounds: p.pfas_compounds,
        key_findings: p.key_findings,
        concentrations: p.concentrations_reported
      }));

      const prompt = `Analyze the following ${selectedData.length} South African CEC research papers and provide:

1. A comprehensive summary of key findings (2-3 paragraphs)
2. Major trends identified across the research
3. Correlations between:
   - CEC compounds and health/environmental impacts
   - Study locations (provinces) and contamination patterns
   - Research types and findings
4. Statistical insights about compound prevalence
5. Geographic patterns of contamination
6. Temporal trends if multiple years present
7. Research gaps and recommendations

Data:
${JSON.stringify(dataSummary, null, 2)}

Return a structured analysis with specific data points and insights.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_trends: { type: "array", items: { type: "string" } },
            correlations: {
              type: "object",
              properties: {
                compounds_impact: { type: "string" },
                geographic_patterns: { type: "string" },
                research_type_insights: { type: "string" }
              }
            },
            statistical_insights: {
              type: "object",
              properties: {
                most_studied_compounds: { type: "array", items: { type: "string" } },
                high_risk_provinces: { type: "array", items: { type: "string" } },
                dominant_research_types: { type: "array", items: { type: "string" } }
              }
            },
            temporal_trends: { type: "string" },
            research_gaps: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Generate visualization data
      const compoundCounts = {};
      const provinceCounts = {};
      const researchTypeCounts = {};
      const yearCounts = {};

      selectedData.forEach(paper => {
        paper.pfas_compounds?.forEach(c => {
          compoundCounts[c] = (compoundCounts[c] || 0) + 1;
        });
        if (paper.province) {
          provinceCounts[paper.province] = (provinceCounts[paper.province] || 0) + 1;
        }
        if (paper.research_type) {
          researchTypeCounts[paper.research_type] = (researchTypeCounts[paper.research_type] || 0) + 1;
        }
        if (paper.publication_year) {
          yearCounts[paper.publication_year] = (yearCounts[paper.publication_year] || 0) + 1;
        }
      });

      const visualizations = {
        compounds: Object.entries(compoundCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),
        provinces: Object.entries(provinceCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
        researchTypes: Object.entries(researchTypeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
        timeline: Object.entries(yearCounts)
          .sort((a, b) => a[0] - b[0])
          .map(([year, count]) => ({ year: parseInt(year), count }))
      };

      setAnalysis({ ...result, visualizations });
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Analysis failed: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">AI-Powered Insights</h1>
          </div>
          <p className="text-slate-600">
            Generate intelligent analysis and visualizations from research data
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Paper Selection */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Papers</span>
                  <Badge variant="secondary">{selectedPapers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={selectAll} variant="outline" className="flex-1" size="sm">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" className="flex-1" size="sm">
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {papers.map(paper => (
                    <button
                      key={paper.id}
                      onClick={() => togglePaper(paper.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPapers.includes(paper.id)
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <p className="font-medium text-sm line-clamp-2">{paper.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {paper.publication_year} • {paper.province || 'N/A'}
                      </p>
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={generateAnalysis}
                  disabled={isAnalyzing || selectedPapers.length === 0}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {!analysis ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-20 text-center">
                  <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-slate-500">
                    Select papers and click "Generate Analysis" to get AI-powered insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Executive Summary */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-teal-600" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {analysis.executive_summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Key Trends */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-teal-600" />
                      Key Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.key_trends?.map((trend, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-teal-600 font-bold mt-1">•</span>
                          <span className="text-slate-700">{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Correlations */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Correlations & Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                        <Beaker className="w-4 h-4 mr-2 text-teal-600" />
                        Compounds & Impact
                      </h4>
                      <p className="text-slate-700">{analysis.correlations?.compounds_impact}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-teal-600" />
                        Geographic Patterns
                      </h4>
                      <p className="text-slate-700">{analysis.correlations?.geographic_patterns}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-teal-600" />
                        Research Type Insights
                      </h4>
                      <p className="text-slate-700">{analysis.correlations?.research_type_insights}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Visualizations */}
                {analysis.visualizations && (
                  <>
                    {/* Compound Distribution */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Most Studied PFAS Compounds</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analysis.visualizations.compounds}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Province Distribution */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Research by Province</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={analysis.visualizations.provinces}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry) => entry.name}
                            >
                              {analysis.visualizations.provinces.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Research Types */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>Research Type Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analysis.visualizations.researchTypes} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" />
                            <YAxis dataKey="name" type="category" stroke="#64748b" width={150} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    {analysis.visualizations.timeline.length > 1 && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle>Publication Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={analysis.visualizations.timeline}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="year" stroke="#64748b" />
                              <YAxis stroke="#64748b" />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Statistical Insights */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Statistical Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Most Studied Compounds</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.statistical_insights?.most_studied_compounds?.map((compound, idx) => (
                          <Badge key={idx} className="bg-teal-100 text-teal-700">{compound}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">High-Risk Provinces</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.statistical_insights?.high_risk_provinces?.map((province, idx) => (
                          <Badge key={idx} className="bg-red-100 text-red-700">{province}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Dominant Research Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.statistical_insights?.dominant_research_types?.map((type, idx) => (
                          <Badge key={idx} className="bg-purple-100 text-purple-700">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Temporal Trends */}
                {analysis.temporal_trends && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Temporal Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed">{analysis.temporal_trends}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Research Gaps & Recommendations */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Research Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.research_gaps?.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold mt-1">⚠</span>
                            <span className="text-slate-700">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.recommendations?.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 font-bold mt-1">✓</span>
                            <span className="text-slate-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}