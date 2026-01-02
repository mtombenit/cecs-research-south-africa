import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2 } from "lucide-react";
import SearchFilters from "@/components/papers/SearchFilters";
import PaperCard from "@/components/papers/PaperCard";
import ExportButton from "@/components/export/ExportButton";

export default function Database() {
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    researchType: '',
    compound: '',
    yearFrom: '',
    yearTo: ''
  });

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      province: '',
      researchType: '',
      compound: '',
      yearFrom: '',
      yearTo: ''
    });
  };

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      // Global search filter - searches across all fields
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          paper.title?.toLowerCase().includes(searchLower) ||
          paper.authors?.some(a => a.toLowerCase().includes(searchLower)) ||
          paper.abstract?.toLowerCase().includes(searchLower) ||
          paper.keywords?.some(k => k.toLowerCase().includes(searchLower)) ||
          paper.key_findings?.toLowerCase().includes(searchLower) ||
          paper.journal?.toLowerCase().includes(searchLower) ||
          paper.institution?.toLowerCase().includes(searchLower) ||
          paper.study_location?.toLowerCase().includes(searchLower) ||
          paper.doi?.toLowerCase().includes(searchLower) ||
          paper.concentrations_reported?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Province filter
      if (filters.province && paper.province !== filters.province) {
        return false;
      }

      // Research type filter
      if (filters.researchType && paper.research_type !== filters.researchType) {
        return false;
      }

      // Compound filter
      if (filters.compound && !paper.pfas_compounds?.includes(filters.compound)) {
        return false;
      }

      // Year filters
      if (filters.yearFrom && paper.publication_year < parseInt(filters.yearFrom)) {
        return false;
      }
      if (filters.yearTo && paper.publication_year > parseInt(filters.yearTo)) {
        return false;
      }

      return true;
    });
  }, [papers, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Research Database</h1>
              <p className="text-slate-600">
                Browse and search CECs research publications from South Africa
              </p>
            </div>
            <ExportButton 
              data={filteredPapers} 
              filename="pfas-research-papers"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchFilters 
          filters={filters} 
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
            <p className="text-slate-500">Loading research papers...</p>
          </div>
        ) : filteredPapers.length > 0 ? (
          <>
            <p className="text-sm text-slate-500 mb-6">
              Showing {filteredPapers.length} of {papers.length} publications
            </p>
            <div className="grid gap-6">
              {filteredPapers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No papers found</h3>
            <p className="text-slate-500">
              {papers.length === 0 
                ? "No research papers have been added yet."
                : "Try adjusting your filters to see more results."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}