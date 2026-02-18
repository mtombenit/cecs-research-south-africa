import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Loader2, BookOpen, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import ExportArticleListPDF from "@/components/export/ExportArticleListPDF";

const PAGE_SIZE = 50;

export default function ArticleList() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('publication_year'),
  });

  // Find duplicate titles
  const titleCounts = papers.reduce((acc, paper) => {
    const title = paper.title?.toLowerCase().trim();
    if (title) {
      acc[title] = (acc[title] || 0) + 1;
    }
    return acc;
  }, {});

  const duplicateCount = Object.values(titleCounts).filter(count => count > 1).reduce((sum, count) => sum + (count - 1), 0);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ResearchPaper.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast.success("Paper deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const deleteAllDuplicatesMutation = useMutation({
    mutationFn: async () => {
      // Group papers by title, keep first, delete rest
      const titleGroups = {};
      papers.forEach(paper => {
        const title = paper.title?.toLowerCase().trim();
        if (title) {
          if (!titleGroups[title]) {
            titleGroups[title] = [];
          }
          titleGroups[title].push(paper);
        }
      });

      // Delete all but the first paper in each group with duplicates
      const deletePromises = [];
      Object.values(titleGroups).forEach(group => {
        if (group.length > 1) {
          // Keep the first one, delete the rest
          group.slice(1).forEach(paper => {
            deletePromises.push(base44.entities.ResearchPaper.delete(paper.id));
          });
        }
      });

      await Promise.all(deletePromises);
      return deletePromises.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast.success(`Deleted ${count} duplicate paper${count !== 1 ? 's' : ''}`);
    },
    onError: (error) => {
      toast.error(`Failed to delete duplicates: ${error.message}`);
    },
  });

  const isDuplicate = (paper) => {
    const title = paper.title?.toLowerCase().trim();
    return titleCounts[title] > 1;
  };

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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">All Research Articles</h1>
            <p className="text-lg text-slate-600">
              Complete list of {papers.length} research papers ranked by publication year.
            </p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'admin' && duplicateCount > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${duplicateCount} duplicate paper${duplicateCount !== 1 ? 's' : ''}? This will keep one copy of each.`)) {
                    deleteAllDuplicatesMutation.mutate();
                  }
                }}
                disabled={deleteAllDuplicatesMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Duplicates ({duplicateCount})
              </Button>
            )}
            <ExportArticleListPDF papers={papers} />
          </div>
        </div>

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
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                        {user?.role === 'admin' && isDuplicate(paper) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Delete duplicate "${paper.title}"?`)) {
                                deleteMutation.mutate(paper.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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