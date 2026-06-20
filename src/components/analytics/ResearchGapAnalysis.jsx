import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

const RESEARCH_DOMAINS = [
  "Environmental Monitoring",
  "Water Quality",
  "Human Health",
  "Treatment Technology",
  "Risk Assessment",
  "Review",
  "Soil Contamination",
  "Wildlife",
];

export default function ResearchGapAnalysis({ papers }) {
  const { radarData, gapInsights, domainCounts } = useMemo(() => {
    const counts = {};
    RESEARCH_DOMAINS.forEach(d => counts[d] = 0);

    papers.forEach(paper => {
      const rt = paper.research_type || "";
      RESEARCH_DOMAINS.forEach(domain => {
        if (rt.toLowerCase().includes(domain.toLowerCase())) {
          counts[domain]++;
        }
      });
    });

    const total = papers.length;
    const radarData = RESEARCH_DOMAINS.map(domain => ({
      domain: domain.replace(" ", "\n"),
      count: counts[domain],
      pct: Math.round((counts[domain] / total) * 100),
    }));

    const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    const gaps = sorted.slice(0, 3).map(([domain, count]) => ({
      domain,
      count,
      severity: count < 5 ? "critical" : count < 15 ? "moderate" : "low",
    }));

    return { radarData, gapInsights: gaps, domainCounts: Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([domain, count]) => ({ domain, count })) };
  }, [papers]);

  const severityConfig = {
    critical: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Critical Gap" },
    moderate: { icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Moderate Gap" },
    low: { icon: CheckCircle, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", label: "Well Covered" },
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Research Domain Coverage</CardTitle>
          <p className="text-sm text-slate-500">Distribution across impact domains</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
              <Radar name="Papers" dataKey="count" stroke="#0d9488" fill="#0d9488" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v) => [v, "Papers"]} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Research Gap Alerts</CardTitle>
          <p className="text-sm text-slate-500">Under-researched domains needing more focus</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {gapInsights.map(({ domain, count, severity }) => {
            const cfg = severityConfig[severity];
            const Icon = cfg.icon;
            return (
              <div key={domain} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                <div>
                  <p className={`text-sm font-semibold ${cfg.color}`}>{domain}</p>
                  <p className="text-xs text-slate-600">{count} papers — {cfg.label}</p>
                </div>
              </div>
            );
          })}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">All Domains</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={domainCounts} margin={{ left: -10 }}>
                <XAxis dataKey="domain" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {domainCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.count < 5 ? "#ef4444" : entry.count < 15 ? "#f59e0b" : "#0d9488"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}