import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, FlaskConical, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import RecentPapers from "@/components/dashboard/RecentPapers";
import CompoundChart from "@/components/dashboard/CompoundChart";
import QuickSearch from "@/components/search/QuickSearch";


export default function Home() {
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year'),
  });

  // Calculate stats
  const uniqueCompounds = new Set();
  const uniqueResearchTypes = new Set();
  papers.forEach(paper => {
    paper.pfas_compounds?.forEach(c => uniqueCompounds.add(c));
    if (paper.research_type) uniqueResearchTypes.add(paper.research_type);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm text-teal-100 text-xs sm:text-sm mb-4 sm:mb-6">
              <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              South African CECs Research Database
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4 sm:mb-6">
              SA CECs Intelligent Portal
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-teal-100/90 leading-relaxed mb-6 sm:mb-8">
              Explore published research on Contaminants of Emerging Concern (CECs) conducted in South Africa. Search, analyze, and interact with research data 
              using AI-powered tools.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link to={createPageUrl("Database")} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white text-teal-700 hover:bg-teal-50 shadow-xl shadow-black/10 h-12 sm:h-11">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Browse Research
                </Button>
              </Link>
              <Link to={createPageUrl("AskAI")} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 sm:h-11">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Ask AI Assistant
                </Button>
              </Link>
              <Link to={createPageUrl("ArticleList")} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 sm:h-11">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  List All Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-10 mb-6 sm:mb-8">
        <QuickSearch />
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Publications"
            value={papers.length}
            icon={FileText}
            trend="South African studies"
          />
          <StatCard
            title="Compounds"
            value={uniqueCompounds.size}
            icon={FlaskConical}
            trend="Unique compounds studied"
          />
          <Card className="relative overflow-hidden p-6 bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">
                  Research Types
                </p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                  {uniqueResearchTypes.size}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {Array.from(uniqueResearchTypes).join(', ')}
            </p>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-teal-500/5 to-teal-500/10 rounded-full" />
          </Card>
          <StatCard
            title="Latest Year"
            value={papers[0]?.publication_year || "—"}
            icon={TrendingUp}
            trend="Most recent publication"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <RecentPapers papers={papers} isLoading={isLoading} />
          <CompoundChart papers={papers} />
        </div>
      </div>

      {/* About PFAS Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 lg:p-12 text-white">
          <h2 className="text-2xl font-bold mb-4">About CECs & PFAS</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            Contaminants of Emerging Concern (CECs) are synthetic chemicals of growing environmental and health concern. PFAS, known as "forever chemicals," 
            have been manufactured since the 1940s and are found in water, soil, and wildlife across the globe.
          </p>
          <p className="text-slate-300 leading-relaxed">
            This intelligent portal focuses on CECs research conducted in South Africa, 
            providing researchers, policymakers, and the public with access to scientific 
            findings specific to the South African context.
          </p>
        </div>
      </div>
    </div>
  );
}