import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentPapers({ papers, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Publications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Publications</CardTitle>
        <Link to={createPageUrl("Database")}>
          <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {papers?.slice(0, 5).map((paper) => (
          <Link 
            key={paper.id} 
            to={createPageUrl(`PaperDetail?id=${paper.id}`)}
            className="block group"
          >
            <div className="p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 transition-all duration-200 border border-transparent hover:border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm line-clamp-2 group-hover:text-teal-700 transition-colors">
                    {paper.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {paper.authors?.slice(0, 2).join(", ")}{paper.authors?.length > 2 ? " et al." : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                   <span className="flex items-center text-xs text-slate-400">
                     <Calendar className="w-3 h-3 mr-1" />
                     {paper.publication_year}
                   </span>
                   {paper.province && (
                     <span className="flex items-center text-xs text-slate-400">
                       <MapPin className="w-3 h-3 mr-1" />
                       {paper.province}
                     </span>
                   )}
                   {(paper.pdf_url || paper.doi) && (
                     <a 
                       href={paper.pdf_url || `https://sci-hub.se/${paper.doi}`}
                       target="_blank" 
                       rel="noopener noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="flex items-center text-xs text-teal-600 hover:text-teal-700"
                     >
                       <Download className="w-3 h-3 mr-1" />
                       PDF
                     </a>
                   )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!papers || papers.length === 0) && (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No papers added yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}