import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import YearRangePicker from "./YearRangePicker";


const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape", "National"
];

const waterTypes = [
  "Dam Water",
  "Drinking Water",
  "Groundwater",
  "Marine-Coastal",
  "River Water",
  "Wastewater"
];

const cecCategories = [
  "Endocrine Disruptors",
  "Microplastics",
  "Nanomaterials",
  "Personal Care Products",
  "Pesticides & Herbicides",
  "PFAS",
  "Pharmaceuticals"
];

export default function SearchFilters({ filters, onFilterChange, onClear, papers }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const activeFilterCount = [
    filters.search,
    filters.province,
    filters.waterType,
    filters.cecCategory,
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
        <label className="text-sm font-medium text-slate-700 mb-2 block">Water Type</label>
        <Select 
          value={filters.waterType || ""} 
          onValueChange={(value) => onFilterChange('waterType', value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All water types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All water types</SelectItem>
            {waterTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">CEC Category</label>
        <Select 
          value={filters.cecCategory || ""} 
          onValueChange={(value) => onFilterChange('cecCategory', value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All CEC categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All CEC categories</SelectItem>
            {cecCategories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Publication Year</label>
        <YearRangePicker
          yearFrom={filters.yearFrom}
          yearTo={filters.yearTo}
          onYearFromChange={(year) => onFilterChange('yearFrom', year)}
          onYearToChange={(year) => onFilterChange('yearTo', year)}
        />
      </div>

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
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search: title, author, keywords..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-12 h-12 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-sm sm:text-base"
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
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All provinces</SelectItem>
            {provinces.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.waterType || ""} 
          onValueChange={(value) => onFilterChange('waterType', value)}
        >
          <SelectTrigger className="bg-white h-10">
            <SelectValue placeholder="Water Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All water types</SelectItem>
            {waterTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.cecCategory || ""} 
          onValueChange={(value) => onFilterChange('cecCategory', value)}
        >
          <SelectTrigger className="bg-white h-10">
            <SelectValue placeholder="CEC Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All CEC categories</SelectItem>
            {cecCategories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="col-span-1">
          <YearRangePicker
            yearFrom={filters.yearFrom}
            yearTo={filters.yearTo}
            onYearFromChange={(year) => onFilterChange('yearFrom', year)}
            onYearToChange={(year) => onFilterChange('yearTo', year)}
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
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {filters.search && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs sm:text-sm whitespace-nowrap">
              Search: "{filters.search.length > 20 ? filters.search.substring(0, 20) + '...' : filters.search}"
              <button onClick={() => onFilterChange('search', '')} className="ml-1.5 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.province && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs sm:text-sm whitespace-nowrap">
              {filters.province}
              <button onClick={() => onFilterChange('province', '')} className="ml-1.5 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.waterType && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs sm:text-sm whitespace-nowrap">
              {filters.waterType}
              <button onClick={() => onFilterChange('waterType', '')} className="ml-1.5 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.cecCategory && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs sm:text-sm whitespace-nowrap">
              {filters.cecCategory}
              <button onClick={() => onFilterChange('cecCategory', '')} className="ml-1.5 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(filters.yearFrom || filters.yearTo) && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs sm:text-sm whitespace-nowrap">
              {filters.yearFrom || '...'} - {filters.yearTo || '...'}
              <button onClick={() => { onFilterChange('yearFrom', ''); onFilterChange('yearTo', ''); }} className="ml-1.5 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}