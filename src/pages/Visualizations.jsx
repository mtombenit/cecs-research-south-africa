import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, Calendar } from "lucide-react";
import YearRangePicker from "@/components/papers/YearRangePicker";
import ExportButton from "@/components/export/ExportButton";
import ProvinceDistribution from "@/components/visualizations/ProvinceDistribution";
import ResearchTypeDistribution from "@/components/visualizations/ResearchTypeDistribution";
import YearTimeline from "@/components/visualizations/YearTimeline";
import CompoundChart from "@/components/dashboard/CompoundChart";

export default function Visualizations() {
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      if (yearFrom && paper.publication_year < parseInt(yearFrom)) return false;
      if (yearTo && paper.publication_year > parseInt(yearTo)) return false;
      return true;
    });
  }, [papers, yearFrom, yearTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-slate-900">Research Visualizations</h1>
            </div>
            <ExportButton 
              data={filteredPapers} 
              filename="pfas-research-data"
              disabled={isLoading}
            />
          </div>
          <p className="text-slate-600">
            Interactive charts and maps showing the distribution of PFAS research across South Africa
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Filter by Publication Year Range
                </Label>
                <YearRangePicker
                  yearFrom={yearFrom}
                  yearTo={yearTo}
                  onYearFromChange={setYearFrom}
                  onYearToChange={setYearTo}
                />
              </div>
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold text-teal-600">{filteredPapers.length}</span> of {papers.length} publications
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        <YearTimeline papers={filteredPapers} />
        
        <div className="grid lg:grid-cols-2 gap-8">
          <ProvinceDistribution papers={filteredPapers} />
          <ResearchTypeDistribution papers={filteredPapers} />
        </div>

        <div className="mt-12">
          <div className="max-w-4xl">
            <CompoundChart papers={filteredPapers} />
          </div>
        </div>
      </div>
    </div>
  );
}