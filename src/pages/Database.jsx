import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import SearchFilters from "@/components/papers/SearchFilters";
import PaperCard from "@/components/papers/PaperCard";
import ExportButton from "@/components/export/ExportButton";
import ProvinceMapViz from "@/components/database-viz/ProvinceMapViz";
import FilteredTimeline from "@/components/database-viz/FilteredTimeline";
import AuthorNetwork from "@/components/database-viz/AuthorNetwork";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Database() {
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    waterType: '',
    cecCategory: '',
    yearFrom: '',
    yearTo: ''
  });
  
  const [showVisualizations, setShowVisualizations] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Read URL parameters and apply them to filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const province = urlParams.get('province');
    const waterType = urlParams.get('waterType');
    const cecCategory = urlParams.get('cecCategory');

    if (province || waterType || cecCategory) {
      setFilters(prev => ({
        ...prev,
        ...(province && { province }),
        ...(waterType && { waterType }),
        ...(cecCategory && { cecCategory })
      }));
    }
  }, []);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year'),
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      province: '',
      waterType: '',
      cecCategory: '',
      yearFrom: '',
      yearTo: ''
    });
  };

  // Identify duplicates by title
  const duplicateTitles = useMemo(() => {
    const titleCount = {};
    papers.forEach(paper => {
      const title = paper.title?.toLowerCase().trim();
      if (title) {
        titleCount[title] = (titleCount[title] || 0) + 1;
      }
    });
    return new Set(
      Object.keys(titleCount).filter(title => titleCount[title] > 1)
    );
  }, [papers]);

  const filteredPapers = useMemo(() => {
    const filtered = papers.filter(paper => {
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

      // Province filter - "National" shows all provinces
      if (filters.province && filters.province !== 'National' && paper.province !== filters.province) {
        return false;
      }

      // Water Type filter - strict matching against sample_matrix
      if (filters.waterType) {
        const waterTypeLower = filters.waterType.toLowerCase();
        const hasWaterType = paper.sample_matrix?.some(m => {
          const matrixLower = m.toLowerCase();
          // Exact or partial match logic
          if (waterTypeLower.includes('dam')) return matrixLower.includes('dam');
          if (waterTypeLower.includes('drinking')) return matrixLower.includes('drinking') || matrixLower.includes('tap');
          if (waterTypeLower.includes('groundwater')) return matrixLower.includes('groundwater') || matrixLower.includes('borehole');
          if (waterTypeLower.includes('marine') || waterTypeLower.includes('coastal')) {
            return matrixLower.includes('marine') || matrixLower.includes('coastal') || matrixLower.includes('ocean') || matrixLower.includes('sea');
          }
          if (waterTypeLower.includes('river')) return matrixLower.includes('river') || matrixLower.includes('stream');
          if (waterTypeLower.includes('wastewater')) return matrixLower.includes('wastewater') || matrixLower.includes('sewage') || matrixLower.includes('effluent');
          return matrixLower.includes(waterTypeLower);
        });
        if (!hasWaterType) return false;
      }

      // CEC Category filter - strict matching
      if (filters.cecCategory) {
        const category = filters.cecCategory.toLowerCase();
        let matchesCategory = false;

        if (category === 'pfas') {
          matchesCategory = paper.pfas_compounds?.length > 0 ||
            paper.keywords?.some(k => k.toLowerCase().includes('pfas') || k.toLowerCase().includes('pfos') || k.toLowerCase().includes('pfoa')) ||
            paper.title?.toLowerCase().includes('pfas') ||
            paper.abstract?.toLowerCase().includes('pfas');
        } else if (category === 'microplastics') {
          matchesCategory = 
            paper.keywords?.some(k => k.toLowerCase().includes('microplastic') || k.toLowerCase().includes('plastic')) ||
            paper.title?.toLowerCase().includes('microplastic') ||
            paper.abstract?.toLowerCase().includes('microplastic');
        } else if (category === 'pharmaceuticals') {
          matchesCategory = 
            paper.keywords?.some(k => k.toLowerCase().includes('pharmaceutical') || k.toLowerCase().includes('drug') || k.toLowerCase().includes('medicine')) ||
            paper.title?.toLowerCase().includes('pharmaceutical') ||
            paper.abstract?.toLowerCase().includes('pharmaceutical');
        } else if (category.includes('pesticide') || category.includes('herbicide')) {
          matchesCategory = 
            paper.keywords?.some(k => k.toLowerCase().includes('pesticide') || k.toLowerCase().includes('herbicide') || k.toLowerCase().includes('agrochemical')) ||
            paper.title?.toLowerCase().includes('pesticide') ||
            paper.title?.toLowerCase().includes('herbicide') ||
            paper.abstract?.toLowerCase().includes('pesticide') ||
            paper.abstract?.toLowerCase().includes('herbicide');
        } else if (category.includes('personal care')) {
          matchesCategory = 
            paper.keywords?.some(k => k.toLowerCase().includes('personal care') || k.toLowerCase().includes('cosmetic') || k.toLowerCase().includes('pcp')) ||
            paper.title?.toLowerCase().includes('personal care') ||
            paper.abstract?.toLowerCase().includes('personal care');
        } else if (category === 'nanomaterials') {
          matchesCategory = 
            paper.keywords?.some(k => k.toLowerCase().includes('nano') || k.toLowerCase().includes('nanoparticle')) ||
            paper.title?.toLowerCase().includes('nano') ||
            paper.abstract?.toLowerCase().includes('nano');
        }

        if (!matchesCategory) return false;
      }

      // Year filters - only apply if values are set
      if (filters.yearFrom && paper.publication_year < parseInt(filters.yearFrom)) {
        return false;
      }
      if (filters.yearTo && paper.publication_year > parseInt(filters.yearTo)) {
        return false;
      }

      return true;
    });
    
    return filtered;
  }, [papers, filters]);

  // Paginate filtered papers
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPapers.slice(startIndex, endIndex);
  }, [filteredPapers, currentPage]);

  const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Research Database</h1>
              <p className="text-sm sm:text-base text-slate-600">
                Browse and search CECs research publications from South Africa
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowVisualizations(!showVisualizations)}
                className="gap-2 flex-1 sm:flex-initial text-sm"
                size="sm"
              >
                {showVisualizations ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Hide Insights</span>
                    <span className="sm:hidden">Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Show Insights</span>
                    <span className="sm:hidden">Show</span>
                  </>
                )}
              </Button>
              <ExportButton 
                data={filteredPapers} 
                filename="pfas-research-papers"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <SearchFilters 
          filters={filters} 
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
          papers={papers}
        />
      </div>

      {/* Visualizations */}
      {showVisualizations && filteredPapers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
          <div className="grid gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <ProvinceMapViz 
                papers={filteredPapers} 
                onProvinceClick={(province) => {
                  handleFilterChange('province', province);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <FilteredTimeline 
                papers={filteredPapers} 
                onYearClick={(year) => {
                  handleFilterChange('yearFrom', year.toString());
                  handleFilterChange('yearTo', year.toString());
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
            <AuthorNetwork 
              papers={filteredPapers} 
              onAuthorClick={(author) => {
                handleFilterChange('search', author);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
            <p className="text-slate-500">Loading research papers...</p>
          </div>
        ) : filteredPapers.length > 0 ? (
          <>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredPapers.length)} of {filteredPapers.length} publications
              {filteredPapers.length !== papers.length && ` (${papers.length} total)`}
            </p>
            <div className="grid gap-4 sm:gap-6">
              {paginatedPapers.map(paper => {
                const isDuplicate = duplicateTitles.has(paper.title?.toLowerCase().trim());
                return (
                  <PaperCard key={paper.id} paper={paper} isDuplicate={isDuplicate} />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                    
                    const showEllipsis = 
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2);

                    if (showEllipsis) {
                      return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                    }
                    
                    if (!showPage) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentPage === pageNum ? "bg-teal-600 hover:bg-teal-700" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
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