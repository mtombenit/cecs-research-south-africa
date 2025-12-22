import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PaperAIChat from "@/components/papers/PaperAIChat";
import SavePaperButton from "@/components/collections/SavePaperButton";
import { 
  ArrowLeft, Calendar, MapPin, Users, FileText, ExternalLink, 
  Beaker, BookOpen, Building2, Download, Loader2 
} from "lucide-react";

export default function PaperDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const paperId = urlParams.get('id');

  const { data: paper, isLoading } = useQuery({
    queryKey: ['paper', paperId],
    queryFn: async () => {
      const papers = await base44.entities.ResearchPaper.filter({ id: paperId });
      return papers[0];
    },
    enabled: !!paperId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Paper not found</h2>
        <Link to={createPageUrl("Database")}>
          <Button variant="outline">Back to Database</Button>
        </Link>
      </div>
    );
  }

  const researchTypeColors = {
    "Environmental Monitoring": "bg-emerald-100 text-emerald-700",
    "Human Health": "bg-rose-100 text-rose-700",
    "Water Quality": "bg-blue-100 text-blue-700",
    "Soil Contamination": "bg-amber-100 text-amber-700",
    "Wildlife": "bg-green-100 text-green-700",
    "Treatment Technology": "bg-purple-100 text-purple-700",
    "Risk Assessment": "bg-orange-100 text-orange-700",
    "Review": "bg-slate-100 text-slate-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to={createPageUrl("Database")}>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 -ml-3 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Database
            </Button>
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {paper.research_type && (
              <Badge className={`${researchTypeColors[paper.research_type]} border-0`}>
                {paper.research_type}
              </Badge>
            )}
            <span className="text-slate-500 flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {paper.publication_year}
            </span>
            {paper.province && (
              <span className="text-slate-500 flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {paper.province}
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight flex-1">
              {paper.title}
            </h1>
            <SavePaperButton paperId={paper.id} variant="default" size="default" />
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4 text-slate-400" />
            <p className="text-sm">
              {paper.authors?.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {paper.abstract && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-slate-900 mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
                    Abstract
                  </h2>
                  <p className="text-slate-600 leading-relaxed">{paper.abstract}</p>
                </CardContent>
              </Card>
            )}

            {paper.key_findings && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">Key Findings</h2>
                  <p className="text-slate-600 leading-relaxed">{paper.key_findings}</p>
                </CardContent>
              </Card>
            )}

            {paper.concentrations_reported && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-slate-900 mb-3">Reported Concentrations</h2>
                  <p className="text-slate-600 leading-relaxed">{paper.concentrations_reported}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publication Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-slate-900">Publication Details</h3>
                
                {paper.journal && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Journal</p>
                    <p className="text-sm text-slate-700 font-medium">{paper.journal}</p>
                  </div>
                )}

                {paper.institution && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Institution</p>
                    <p className="text-sm text-slate-700 flex items-center">
                      <Building2 className="w-4 h-4 mr-1.5 text-slate-400" />
                      {paper.institution}
                    </p>
                  </div>
                )}

                {paper.doi && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">DOI</p>
                    <a 
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
                    >
                      {paper.doi}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}

                {paper.study_location && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Study Location</p>
                    <p className="text-sm text-slate-700">{paper.study_location}</p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <a 
                    href={paper.pdf_url || `https://sci-hub.se/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-teal-600 hover:bg-teal-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* PFAS Compounds */}
            {paper.pfas_compounds?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                    <Beaker className="w-5 h-5 mr-2 text-teal-600" />
                    PFAS Compounds
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.pfas_compounds.map((compound, idx) => (
                      <Badge 
                        key={idx} 
                        className="bg-teal-50 text-teal-700 border border-teal-200"
                      >
                        {compound}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sample Matrix */}
            {paper.sample_matrix?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Sample Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.sample_matrix.map((sample, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline"
                        className="border-slate-300"
                      >
                        {sample}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keywords */}
            {paper.keywords?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            </div>

            {/* AI Chat About This Paper */}
            <div className="lg:col-span-2 space-y-8">
              <PaperAIChat paper={paper} />
            </div>

            {/* PDF Viewer */}
            {paper.pdf_url && (
              <div className="lg:col-span-3 mt-8 lg:mt-0">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">PDF Preview</h3>
                      <a 
                        href={paper.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:text-teal-700"
                      >
                        Open in new tab
                      </a>
                    </div>
                    <iframe
                      src={paper.pdf_url}
                      className="w-full h-[800px]"
                      title="PDF Viewer"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            </div>
            </div>
            </div>
            );
            }