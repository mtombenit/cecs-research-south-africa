import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Loader2, X, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AISearchBox({ onFiltersApply, papers }) {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [autoComplete, setAutoComplete] = useState([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Generate GUARANTEED suggestions based on actual database content
  useEffect(() => {
    const generateSmartSuggestions = async () => {
      if (!papers || papers.length === 0) return;
      
      setIsGeneratingSuggestions(true);
      
      try {
        // Build comprehensive database statistics
        const provinceCount = {};
        const compoundCount = {};
        const waterTypeCount = {};
        const keywordCount = {};
        const yearCount = {};
        
        papers.forEach(paper => {
          if (paper.province) provinceCount[paper.province] = (provinceCount[paper.province] || 0) + 1;
          paper.pfas_compounds?.forEach(c => compoundCount[c] = (compoundCount[c] || 0) + 1);
          paper.sample_matrix?.forEach(w => waterTypeCount[w] = (waterTypeCount[w] || 0) + 1);
          paper.keywords?.forEach(k => keywordCount[k] = (keywordCount[k] || 0) + 1);
          if (paper.publication_year) yearCount[paper.publication_year] = (yearCount[paper.publication_year] || 0) + 1;
        });
        
        const topProvinces = Object.entries(provinceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topCompounds = Object.entries(compoundCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const topWaterTypes = Object.entries(waterTypeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topKeywords = Object.entries(keywordCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const recentYears = Object.keys(yearCount).sort((a, b) => b - a).slice(0, 3);
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate 6 search query suggestions that are GUARANTEED to return results from this database.

STRICT DATABASE CONTENT (use ONLY these exact values):
Top Provinces (${topProvinces.length} available): ${topProvinces.map(p => `${p[0]} (${p[1]} papers)`).join(', ')}
Top Compounds (${topCompounds.length} available): ${topCompounds.map(c => `${c[0]} (${c[1]} papers)`).join(', ')}
Top Water Types (${topWaterTypes.length} available): ${topWaterTypes.map(w => `${w[0]} (${w[1]} papers)`).join(', ')}
Top Keywords (${topKeywords.length} available): ${topKeywords.map(k => `${k[0]} (${k[1]} papers)`).join(', ')}
Recent Years with data: ${recentYears.join(', ')}
Total papers in database: ${papers.length}

CRITICAL RULES:
1. Use ONLY provinces, compounds, water types, and keywords listed above
2. Each suggestion MUST combine elements that exist in the database
3. Prefer combinations with higher paper counts to guarantee results
4. Mix simple queries (1 filter) with complex ones (2-3 filters)
5. Use natural language but ground every term in the actual data
6. Example: "PFAS in Gauteng water" (if both PFAS and Gauteng exist in data)

Generate 6 diverse queries - mix of broad and specific - that will definitely return results.`,
          response_json_schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });
        
        if (result?.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
        } else {
          // Direct fallback using exact database content
          const directSuggestions = [
            topProvinces[0] && `research in ${topProvinces[0][0]}`,
            topCompounds[0] && topProvinces[0] && `${topCompounds[0][0]} in ${topProvinces[0][0]}`,
            topWaterTypes[0] && `${topWaterTypes[0][0]} studies`,
            topKeywords[0] && `${topKeywords[0][0]}`,
            recentYears[0] && `studies published in ${recentYears[0]}`,
            topCompounds[0] && topWaterTypes[0] && `${topCompounds[0][0]} in ${topWaterTypes[0][0]}`
          ].filter(Boolean);
          setSuggestions(directSuggestions);
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
        // Final fallback with basic queries
        const basicSuggestions = [
          'water contamination studies',
          'PFAS research',
          'recent publications',
          'environmental monitoring'
        ];
        setSuggestions(basicSuggestions);
      } finally {
        setIsGeneratingSuggestions(false);
      }
    };
    
    generateSmartSuggestions();
  }, [papers]);

  // Auto-complete based on typing
  useEffect(() => {
    if (query.length > 2 && papers) {
      const terms = new Set();
      const queryLower = query.toLowerCase();
      
      papers.forEach(paper => {
        // Extract relevant terms
        paper.keywords?.forEach(k => {
          if (k.toLowerCase().includes(queryLower)) terms.add(k);
        });
        if (paper.province?.toLowerCase().includes(queryLower)) terms.add(paper.province);
        paper.sample_matrix?.forEach(m => {
          if (m.toLowerCase().includes(queryLower)) terms.add(m);
        });
      });
      
      setAutoComplete(Array.from(terms).slice(0, 5));
    } else {
      setAutoComplete([]);
    }
  }, [query, papers]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseNaturalLanguage = async (naturalQuery) => {
    setIsProcessing(true);
    
    try {
      // Extract key terms from query for broad search
      const searchTerms = naturalQuery.toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      // Start with ONLY search term - most likely to return results
      let filters = {
        province: '',
        waterType: '',
        cecCategory: '',
        yearFrom: '',
        yearTo: '',
        search: searchTerms.slice(0, 3).join(' ') || naturalQuery
      };
      
      // Test with just search term
      let testResults = papers.filter(paper => {
        const searchLower = filters.search.toLowerCase();
        return paper.title?.toLowerCase().includes(searchLower) ||
               paper.abstract?.toLowerCase().includes(searchLower) ||
               paper.keywords?.some(k => k.toLowerCase().includes(searchLower)) ||
               paper.pfas_compounds?.some(c => c.toLowerCase().includes(searchLower)) ||
               paper.study_location?.toLowerCase().includes(searchLower);
      });
      
      // If we got good results (10+), we can try to narrow down with ONE additional filter
      if (testResults.length >= 10) {
        // Check if query mentions a specific province
        const provinceList = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
                             'Free State', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West'];
        const mentionedProvince = provinceList.find(p => 
          naturalQuery.toLowerCase().includes(p.toLowerCase())
        );
        
        if (mentionedProvince) {
          const provinceResults = testResults.filter(p => p.province === mentionedProvince);
          if (provinceResults.length > 0) {
            testResults = provinceResults;
            filters.province = mentionedProvince;
          }
        }
      }
      
      // If still no results or very few, try broader single-word searches
      if (testResults.length === 0) {
        // Try each major term individually
        for (const term of searchTerms) {
          const broadResults = papers.filter(paper => {
            const termLower = term.toLowerCase();
            return paper.title?.toLowerCase().includes(termLower) ||
                   paper.abstract?.toLowerCase().includes(termLower) ||
                   paper.keywords?.some(k => k.toLowerCase().includes(termLower)) ||
                   paper.pfas_compounds?.some(c => c.toLowerCase().includes(termLower));
          });
          
          if (broadResults.length > 0) {
            testResults = broadResults;
            filters.search = term;
            break;
          }
        }
      }
      
      // Absolute fallback: show all papers
      if (testResults.length === 0) {
        filters = { province: '', waterType: '', cecCategory: '', yearFrom: '', yearTo: '', search: '' };
        toast.info(`No exact matches found. Showing all ${papers.length} papers.`);
      } else {
        toast.success(`Found ${testResults.length} matching papers!`);
      }

      onFiltersApply(filters);
      setShowSuggestions(false);
    } catch (error) {
      console.error("AI search error:", error);
      // Just apply search term on error
      onFiltersApply({
        province: '',
        waterType: '',
        cecCategory: '',
        yearFrom: '',
        yearTo: '',
        search: naturalQuery
      });
      toast.info("Applied basic search");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      parseNaturalLanguage(query);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    parseNaturalLanguage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1" ref={inputRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Try: 'microplastics in Gauteng river water after 2020'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-10 h-14 bg-white border-2 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-base shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isProcessing}
          className="h-14 px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              AI Search
            </>
          )}
        </Button>
      </div>

      {/* Suggestions & Auto-complete Dropdown */}
      {showSuggestions && (suggestions.length > 0 || autoComplete.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto"
        >
          {autoComplete.length > 0 && (
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {autoComplete.map((term, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer hover:bg-teal-100 hover:text-teal-700"
                    onClick={() => {
                      setQuery(term);
                      setShowSuggestions(false);
                    }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-2">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2 px-2">Example Queries</p>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded flex items-center justify-between group"
              >
                <span className="text-sm text-slate-700">{suggestion}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}