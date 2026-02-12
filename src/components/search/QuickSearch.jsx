import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Droplet, FlaskConical } from "lucide-react";
import { createPageUrl } from "@/utils";

const PROVINCES = [
  "Western Cape", "Mpumalanga", "Northern Cape", "KwaZulu-Natal", 
  "Gauteng", "Eastern Cape", "North West", "Free State", "Limpopo"
];

const WATER_SOURCES = [
  "Dam Water", "Drinking Water", "Groundwater", "Marine-Coastal", "River Water", "Wastewater"
];

const CEC_CLASSES = [
  "Microplastics", "Nanomaterials", "Personal Care Products", 
  "Pesticides & Herbicides", "PFAS", "Pharmaceuticals"
];

export default function QuickSearch() {
  const [province, setProvince] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [cecClass, setCecClass] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    if (waterSource) params.set('waterSource', waterSource);
    if (cecClass) params.set('cecClass', cecClass);
    
    navigate(`${createPageUrl('Database')}?${params.toString()}`);
  };

  const hasAnySelection = province || waterSource || cecClass;

  return (
    <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Guided Database Search</h3>
          <p className="text-sm text-slate-500">Select criteria to find relevant research</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Level 1: Province */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Level 1: Province
          </label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger>
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map(prov => (
                <SelectItem key={prov} value={prov}>{prov}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 2: Water Source */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Droplet className="w-4 h-4 text-teal-600" />
            Level 2: Water Source
          </label>
          <Select value={waterSource} onValueChange={setWaterSource}>
            <SelectTrigger>
              <SelectValue placeholder="Select water source" />
            </SelectTrigger>
            <SelectContent>
              {WATER_SOURCES.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 3: CEC Class */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            Level 3: CEC Class
          </label>
          <Select value={cecClass} onValueChange={setCecClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select CEC class" />
            </SelectTrigger>
            <SelectContent>
              {CEC_CLASSES.map(cec => (
                <SelectItem key={cec} value={cec}>{cec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {hasAnySelection ? 'Click search to view filtered results' : 'Select at least one criteria to search'}
        </p>
        <Button 
          onClick={handleSearch} 
          disabled={!hasAnySelection}
          size="lg"
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Database
        </Button>
      </div>
    </Card>
  );
}