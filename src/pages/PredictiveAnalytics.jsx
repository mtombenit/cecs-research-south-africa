import { useState } from "react";
import { TrendingUp } from "lucide-react";
import ARCWRCCECs from "./ARCWRCCECs";
import PFASPredictor from "./PFASPredictor";

export default function PredictiveAnalytics() {
  const [activeTab, setActiveTab] = useState("pfas");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md shadow-teal-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Predictive Analytics</h1>
          </div>
          <p className="text-slate-500 ml-14">
            ML-powered site predictors trained on South African environmental data.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200">
          {[{ key: "pfas", label: "PFAS Analytics" }, { key: "cecs", label: "ARC-WRC CECs" }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-teal-600 text-teal-700 bg-teal-50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "cecs" && <ARCWRCCECs />}
        {activeTab === "pfas" && <PFASPredictor />}
      </div>
    </div>
  );
}