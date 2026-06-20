import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart3, Network, TrendingUp, Building2, Droplets } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContaminantCooccurrence from "@/components/analytics/ContaminantCooccurrence";
import ResearchGapAnalysis from "@/components/analytics/ResearchGapAnalysis";
import LongitudinalTrends from "@/components/analytics/LongitudinalTrends";
import InstitutionalImpact from "@/components/analytics/InstitutionalImpact";
import WaterSourceRiskProfile from "@/components/analytics/WaterSourceRiskProfile";

const TABS = [
  { id: "cooccurrence", label: "Contaminants", icon: Network, description: "Co-occurrence & compound frequency" },
  { id: "gaps", label: "Research Gaps", icon: BarChart3, description: "Under-researched domains" },
  { id: "trends", label: "Trends", icon: TrendingUp, description: "Publication & research type evolution" },
  { id: "institutions", label: "Institutions", icon: Building2, description: "Institutional impact rankings" },
  { id: "risk", label: "Water Risk", icon: Droplets, description: "Source & sampling risk profile" },
];

export default function AdvancedAnalytics() {
  const [activeTab, setActiveTab] = useState("cooccurrence");

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
          </div>
          <p className="text-slate-600">
            Deep insights across {papers.length} research publications — contaminant patterns, research gaps, institutional impact, and more.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-2 h-auto gap-1 bg-slate-100 p-1 rounded-xl">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 py-2 px-1 text-xs data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {activeTabConfig && (
            <p className="text-sm text-slate-500 mb-6">{activeTabConfig.description}</p>
          )}

          <TabsContent value="cooccurrence">
            <ContaminantCooccurrence papers={papers} />
          </TabsContent>

          <TabsContent value="gaps">
            <ResearchGapAnalysis papers={papers} />
          </TabsContent>

          <TabsContent value="trends">
            <LongitudinalTrends papers={papers} />
          </TabsContent>

          <TabsContent value="institutions">
            <InstitutionalImpact papers={papers} />
          </TabsContent>

          <TabsContent value="risk">
            <WaterSourceRiskProfile papers={papers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}