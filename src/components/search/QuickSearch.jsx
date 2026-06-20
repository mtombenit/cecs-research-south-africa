import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Droplet, FlaskConical, Atom, Sun, RotateCcw } from "lucide-react";
import { createPageUrl } from "@/utils";

const COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Democratic Republic of Congo", "Republic of Congo", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho",
  "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
  "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia",
  "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia",
  "Uganda", "Zambia", "Zimbabwe",
  "Global (Review)", "Multiple Countries"
];

const PROVINCES_BY_COUNTRY = {
  "South Africa": [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
    "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape", "National"
  ],
  "Kenya": ["Nairobi County", "Central Region", "Eastern Region", "Western Region", "Northern Region", "Southern Region"],
  "default": ["Northern Region", "Southern Region", "Eastern Region", "Western Region", "Central Region", "National"]
};

const WATER_SOURCES = [
  "River surface water", "Dam Water", "Drinking Water", "Groundwater",
  "Marine-Coastal", "Wastewater", "Lake", "Sediment", "Not specified"
];

const CEC_CLASSES = [
  "PFAS", "Endocrine Disruptors", "Microplastics", "Nanomaterials",
  "Personal Care Products", "Pesticides & Herbicides", "Pharmaceuticals"
];

const ANALYTES = [
  "∑PFAS", "PFOA", "PFOS", "PFNA", "PFHxS", "PFDA", "PFUnDA",
  "PFBS", "PFHxA", "PFHpA", "PFBA", "PFOSA", "6:2 FTS"
];

const SEASONS = ["Dry", "Wet", "Summer", "Winter", "Spring", "Autumn", "Year-round", "Not specified"];

export default function QuickSearch() {
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [cecClass, setCecClass] = useState("");
  const [analyte, setAnalyte] = useState("");
  const [season, setSeason] = useState("");
  const navigate = useNavigate();

  const provinces = country
    ? (PROVINCES_BY_COUNTRY[country] || PROVINCES_BY_COUNTRY["default"])
    : [];

  const handleCountryChange = (val) => {
    setCountry(val);
    setProvince(""); // reset province when country changes
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (province) params.set('province', province);
    if (waterSource) params.set('waterType', waterSource);
    if (cecClass) params.set('cecClass', cecClass);
    if (analyte) params.set('analyte', analyte);
    if (season) params.set('season', season);
    navigate(`${createPageUrl('Database')}?${params.toString()}`);
  };

  const handleReset = () => {
    setCountry("");
    setProvince("");
    setWaterSource("");
    setCecClass("");
    setAnalyte("");
    setSeason("");
  };

  const hasAnySelection = country || province || waterSource || cecClass || analyte || season;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-4 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Guided database search</h3>
          <p className="text-sm text-teal-100">Select criteria to find relevant research across African provinces</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

          {/* Level 1: Country */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Level 1: Country
            </label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Level 2: Province / Region */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Level 2: Province / Region
            </label>
            <Select value={province} onValueChange={setProvince} disabled={!country}>
              <SelectTrigger className="bg-white border-slate-200 disabled:opacity-50">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Level 3: Water Source */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5" /> Level 3: Water Source
            </label>
            <Select value={waterSource} onValueChange={setWaterSource}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select water source" />
              </SelectTrigger>
              <SelectContent>
                {WATER_SOURCES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Level 4: CEC Class */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> Level 4: CEC Class
            </label>
            <Select value={cecClass} onValueChange={setCecClass}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select CEC class" />
              </SelectTrigger>
              <SelectContent>
                {CEC_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Level 5: Analyte */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5" /> Level 5: Analyte
            </label>
            <Select value={analyte} onValueChange={setAnalyte}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select analyte" />
              </SelectTrigger>
              <SelectContent>
                {ANALYTES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Level 6: Season */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Level 6: Season
            </label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSearch}
            disabled={!hasAnySelection}
            className="bg-teal-600 hover:bg-teal-700 h-10 px-6"
          >
            <Search className="w-4 h-4 mr-2" />
            Search research
          </Button>
          {hasAnySelection && (
            <Button variant="outline" onClick={handleReset} className="h-10 px-4 text-slate-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}