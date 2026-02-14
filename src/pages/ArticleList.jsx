import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Loader2, BookOpen } from "lucide-react";

export default function ArticleList() {
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('publication_year'),
  });

  // Group papers by publication year while maintaining numbering
  const groupedPapers = papers.reduce((acc, paper, index) => {
    const year = paper.publication_year || 'Unknown';
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push({ ...paper, globalIndex: index });
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedPapers).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return a - b;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">All Research Articles</h1>
        <p className="text-lg text-slate-600 mb-8">
          Complete list of {papers.length} research papers ranked by publication year.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
            <p className="text-slate-500">Loading articles...</p>
          </div>
        ) : papers.length > 0 ? (
          <div className="space-y-6">
            {sortedYears.map(year => (
              <div key={year}>
                <h2 className="text-2xl font-bold text-teal-700 mb-4 pb-2 border-b-2 border-teal-200">
                  {year}
                </h2>
                <div className="bg-white shadow-sm rounded-lg border border-slate-200 divide-y divide-slate-200">
                  {groupedPapers[year].map((paper) => (
                    <div key={paper.id} className="flex items-start p-4 hover:bg-slate-50 transition-colors">
                      <span className="text-slate-500 font-medium mr-4 flex-shrink-0 w-12 text-right">
                        {paper.globalIndex + 1}.
                      </span>
                      <div className="flex-grow">
                        <Link 
                          to={createPageUrl(`PaperDetail?id=${paper.id}`)} 
                          className="text-teal-700 hover:text-teal-800 font-semibold text-lg leading-tight"
                        >
                          {paper.title}
                        </Link>
                        <p className="text-slate-600 text-sm mt-1">
                          {paper.authors?.join(', ')}
                        </p>
                        {paper.journal && (
                          <p className="text-slate-500 text-xs mt-0.5">{paper.journal}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-500">There are no research articles in the database yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}