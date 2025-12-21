import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const researchTypes = [
  "Environmental Monitoring", "Human Health", "Water Quality", 
  "Soil Contamination", "Wildlife", "Treatment Technology", "Risk Assessment", "Review"
];

const commonCompounds = [
  "PFOA", "PFOS", "PFHxS", "PFNA", "PFDA", "PFUnA", "PFDoA", 
  "PFBS", "PFHxA", "PFHpA", "GenX", "PFBA"
];

export default function SearchFilters({ filters, onFilterChange, onClear }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const activeFilterCount = [
    filters.search,
    filters.province,
    filters.researchType,
    filters.compound,
    filters.yearFrom,
    filters.yearTo
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Province</label>
        <Select 
          value={filters.province || ""} 
          onValueChange={(value) => onFilterChange('province', value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All provinces</SelectItem>
            {provinces.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Research Type</label>
        <Select 
          value={filters.researchType || ""} 
          onValueChange={(value) => onFilterChange('researchType', value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All types</SelectItem>
            {researchTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">PFAS Compound</label>
        <Select 
          value={filters.compound || ""} 
          onValueChange={(value) => onFilterChange('compound', value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All compounds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All compounds</SelectItem>
            {commonCompounds.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Publication Year</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="From"
            value={filters.yearFrom || ""}
            onChange={(e) => onFilterChange('yearFrom', e.target.value)}
            className="bg-white"
            min="1990"
            max="2030"
          />
          <Input
            type="number"
            placeholder="To"
            value={filters.yearTo || ""}
            onChange={(e) => onFilterChange('yearTo', e.target.value)}
            className="bg-white"
            min="1990"
            max="2030"
          />
        </div>
        </div>
        )}

      {activeFilterCount > 0 && (
        <Button 
          variant="outline" 
          onClick={onClear}
          className="w-full text-slate-600 border-slate-300"
        >
          <X className="w-4 h-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Global Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search across all fields: title, author, keywords, abstract, findings, location, journal..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-12 h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-base"
          />
        </div>
        
        {/* Mobile filter trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden h-12 px-4 relative">
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white rounded-full text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Advanced Filters */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="bg-teal-600 text-white">{activeFilterCount} active</Badge>
          )}
        </div>
        <div className="grid lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Select 
          value={filters.province || ""} 
          onValueChange={(value) => onFilterChange('province', value)}
        >
          <SelectTrigger className="bg-white h-10">
            <SelectValue placeholder="Filter by Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All provinces</SelectItem>
            {provinces.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.researchType || ""} 
          onValueChange={(value) => onFilterChange('researchType', value)}
        >
          <SelectTrigger className="bg-white h-10">
            <SelectValue placeholder="Filter by Research Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All types</SelectItem>
            {researchTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.compound || ""} 
          onValueChange={(value) => onFilterChange('compound', value)}
        >
          <SelectTrigger className="bg-white h-10">
            <SelectValue placeholder="Filter by PFAS Compound" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All compounds</SelectItem>
            {commonCompounds.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 col-span-1">
          <Input
            type="number"
            placeholder="Year from"
            value={filters.yearFrom || ""}
            onChange={(e) => onFilterChange('yearFrom', e.target.value)}
            className="bg-white h-10"
            min="1990"
            max="2030"
          />
          <Input
            type="number"
            placeholder="Year to"
            value={filters.yearTo || ""}
            onChange={(e) => onFilterChange('yearTo', e.target.value)}
            className="bg-white h-10"
            min="1990"
            max="2030"
          />
        </div>

        {activeFilterCount > 0 && (
          <Button 
            variant="outline" 
            onClick={onClear}
            className="text-slate-600 hover:text-slate-900 h-10"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
        </div>
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
              Search: "{filters.search}"
              <button onClick={() => onFilterChange('search', '')} className="ml-1.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.province && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
              {filters.province}
              <button onClick={() => onFilterChange('province', '')} className="ml-1.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.researchType && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
              {filters.researchType}
              <button onClick={() => onFilterChange('researchType', '')} className="ml-1.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.compound && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
              {filters.compound}
              <button onClick={() => onFilterChange('compound', '')} className="ml-1.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(filters.yearFrom || filters.yearTo) && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
              {filters.yearFrom || '...'} - {filters.yearTo || '...'}
              <button onClick={() => { onFilterChange('yearFrom', ''); onFilterChange('yearTo', ''); }} className="ml-1.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}