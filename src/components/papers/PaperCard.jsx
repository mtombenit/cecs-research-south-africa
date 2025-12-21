import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SavePaperButton from "@/components/collections/SavePaperButton";
import { FileText, MapPin, Calendar, ExternalLink, Users, Beaker, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PaperCard({ paper }) {
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
    <Card className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-white cursor-pointer">
      <Link to={createPageUrl(`PaperDetail?id=${paper.id}`)} className="block">
        <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {paper.research_type && (
                <Badge className={`${researchTypeColors[paper.research_type]} border-0 font-medium`}>
                  {paper.research_type}
                </Badge>
              )}
              <span className="text-sm text-slate-400 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {paper.publication_year}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 mb-2">
              {paper.title}
            </h3>
            
            <p className="text-sm text-slate-500 flex items-center mb-3">
              <Users className="w-4 h-4 mr-1.5 text-slate-400" />
              {paper.authors?.slice(0, 3).join(", ")}{paper.authors?.length > 3 ? " et al." : ""}
            </p>
            
            {paper.abstract && (
              <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                {paper.abstract}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {paper.pfas_compounds?.slice(0, 5).map((compound, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700"
                >
                  <Beaker className="w-3 h-3 mr-1" />
                  {compound}
                </span>
              ))}
              {paper.pfas_compounds?.length > 5 && (
                <span className="text-xs text-slate-400 self-center">
                  +{paper.pfas_compounds.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {paper.province && (
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-teal-500" />
                {paper.province}
              </span>
            )}
            {paper.journal && (
              <span className="hidden sm:flex items-center">
                <FileText className="w-4 h-4 mr-1 text-slate-400" />
                {paper.journal}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <SavePaperButton paperId={paper.id} />
            {paper.pdf_url && (
              <a 
                href={paper.pdf_url} 
                download
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-teal-600">
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </a>
            )}
            {paper.doi && (
              <a 
                href={`https://doi.org/${paper.doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-teal-600">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  DOI
                </Button>
              </a>
            )}
            <Link to={createPageUrl(`PaperDetail?id=${paper.id}`)}>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                View Details
              </Button>
            </Link>
          </div>
          </div>
          </div>
          </Link>
          </Card>
          );
          }