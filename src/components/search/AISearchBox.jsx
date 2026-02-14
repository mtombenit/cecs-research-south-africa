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

  // Generate AI-powered smart suggestions based on database content
  useEffect(() => {
    const generateSmartSuggestions = async () => {
      if (!papers || papers.length === 0) return;
      
      setIsGeneratingSuggestions(true);
      
      try {
        // Gather database insights
        const recentPapers = papers.slice(0, 50);
        const provinces = [...new Set(papers.map(p => p.province).filter(Boolean))];
        const compounds = [...new Set(papers.flatMap(p => p.pfas_compounds || []))];
        const waterTypes = [...new Set(papers.flatMap(p => p.sample_matrix || []))];
        const keywords = [...new Set(papers.flatMap(p => p.keywords || []))].slice(0, 30);
        const years = [...new Set(papers.map(p => p.publication_year))].sort((a, b) => b - a);
        
        // Sample titles for context
        const sampleTitles = recentPapers.slice(0, 10).map(p => p.title);
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate 6 diverse, intelligent search query suggestions for a South African CECs (Contaminants of Emerging Concern) research database.

Database Context:
- Available Provinces: ${provinces.join(', ')}
- Common Compounds: ${compounds.slice(0, 15).join(', ')}
- Water Types: ${waterTypes.slice(0, 10).join(', ')}
- Keywords: ${keywords.join(', ')}
- Year Range: ${years[years.length - 1]} - ${years[0]}
- Sample Titles: ${sampleTitles.slice(0, 5).join(' | ')}

Generate natural language queries that:
1. Combine specific locations (provinces/cities) with contaminants
2. Focus on specific water types (groundwater, drinking water, etc.)
3. Include temporal aspects (recent studies, after 2020, etc.)
4. Mix compound types (PFAS, microplastics, pharmaceuticals)
5. Are specific enough to return actual results but broad enough to be useful
6. Sound natural and conversational

Return ONLY queries that would realistically find papers in this database based on the context above.`,
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
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
        // Fallback to database-driven suggestions
        const fallbackSuggestions = [
          provinces[0] && `research in ${provinces[0]}`,
          compounds[0] && `${compounds[0]} contamination studies`,
          waterTypes[0] && `${waterTypes[0]} analysis`,
          `recent studies after ${years[2] || 2020}`,
          keywords[0] && `${keywords[0]} research`
        ].filter(Boolean).slice(0, 6);
        setSuggestions(fallbackSuggestions);
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
      // Get database context for RAG
      const allKeywords = [...new Set(papers.flatMap(p => p.keywords || []))].join(', ');
      const allCompounds = [...new Set(papers.flatMap(p => p.pfas_compounds || []))].join(', ');
      const provinces = [...new Set(papers.map(p => p.province).filter(Boolean))].join(', ');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a specialized search assistant for a South African CECs research database. Parse this natural language query and extract filters that will find relevant papers.

Query: "${naturalQuery}"

Database Context (RAG):
- Available Provinces: ${provinces}
- Available Compounds: ${allCompounds}
- Common Keywords: ${allKeywords.slice(0, 500)}

Extract filters if mentioned or IMPLIED from the query:
- Province: One of [Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, Western Cape, National]
- Water Type: One of [Dam Water, Drinking Water, Groundwater, Marine-Coastal, River Water, Wastewater]
- CEC Category: One of [Microplastics, Nanomaterials, Personal Care Products, Pesticides & Herbicides, PFAS, Pharmaceuticals]
- Year From: Starting year (if "after X", "since X", or "recent" mentioned)
- Year To: Ending year (if "before X" or "until X" mentioned)
- General Search Terms: Extract specific compounds, keywords, or concepts to search across titles, abstracts, and keywords

Important:
- "recent" or "latest" = set yearFrom to 2020
- Be smart about synonyms (e.g., "drugs" = Pharmaceuticals, "plastics" = Microplastics)
- Include specific compound names in search terms
- If location is mentioned but not an exact province match, include it in search terms

Return structured filters that will maximize relevant results from the database.`,
        response_json_schema: {
          type: "object",
          properties: {
            province: { type: "string" },
            waterType: { type: "string" },
            cecCategory: { type: "string" },
            yearFrom: { type: "string" },
            yearTo: { type: "string" },
            search: { type: "string" }
          }
        }
      });

      if (result) {
        const filters = {
          province: result.province || '',
          waterType: result.waterType || '',
          cecCategory: result.cecCategory || '',
          yearFrom: result.yearFrom || '',
          yearTo: result.yearTo || '',
          search: result.search || naturalQuery
        };

        onFiltersApply(filters);
        toast.success("Search filters applied!");
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("AI search error:", error);
      toast.error("Search failed - please try rephrasing your query");
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