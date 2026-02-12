import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Loader2, X, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SUGGESTED_QUERIES = [
  "microplastics in river water in Gauteng after 2020",
  "PFAS studies in Western Cape drinking water",
  "pharmaceutical contamination in wastewater",
  "pesticides in groundwater KwaZulu-Natal",
  "nanomaterials in marine water recent studies"
];

export default function AISearchBox({ onFiltersApply, papers }) {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(SUGGESTED_QUERIES);
  const [autoComplete, setAutoComplete] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Generate smart suggestions based on database content
  useEffect(() => {
    if (papers && papers.length > 0) {
      const recentYears = [...new Set(papers.map(p => p.publication_year))]
        .filter(y => y >= 2020)
        .sort((a, b) => b - a);
      
      const topProvinces = [...new Set(papers.map(p => p.province).filter(Boolean))];
      const topCompounds = [...new Set(papers.flatMap(p => p.pfas_compounds || []))].slice(0, 5);
      
      const dynamicSuggestions = [
        ...SUGGESTED_QUERIES,
        topProvinces[0] && `research in ${topProvinces[0]} published in ${recentYears[0]}`,
        topCompounds[0] && `${topCompounds[0]} contamination studies`,
      ].filter(Boolean).slice(0, 6);
      
      setSuggestions(dynamicSuggestions);
    }
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
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Parse this natural language search query for a CECs research database and extract filter criteria.

Query: "${naturalQuery}"

Extract the following filters if mentioned:
- Province: One of [Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, Western Cape, National]
- Water Type: One of [Dam Water, Drinking Water, Groundwater, Marine-Coastal, River Water, Wastewater]
- CEC Category: One of [Microplastics, Nanomaterials, Personal Care Products, Pesticides & Herbicides, PFAS, Pharmaceuticals]
- Year From: Starting year (number)
- Year To: Ending year (number)
- General Search Terms: Any keywords, compounds, or general terms to search

Return ONLY the filters that are explicitly mentioned or clearly implied. Leave others empty.`,
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
        // Clean up the filters - only keep non-empty values
        const filters = {
          province: result.province || '',
          waterType: result.waterType || '',
          cecCategory: result.cecCategory || '',
          yearFrom: result.yearFrom || '',
          yearTo: result.yearTo || '',
          search: result.search || ''
        };

        onFiltersApply(filters);
        toast.success("AI search applied successfully!");
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("AI search error:", error);
      toast.error("Could not process natural language query");
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