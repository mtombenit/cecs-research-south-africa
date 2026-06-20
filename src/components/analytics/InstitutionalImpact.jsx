import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { Award, BookOpen, FlaskConical } from "lucide-react";

export default function InstitutionalImpact({ papers }) {
  const { institutionData, topInstitution } = useMemo(() => {
    const instMap = {};

    papers.forEach(paper => {
      const inst = paper.institution;
      if (!inst) return;
      // Normalize long names
      const key = inst.length > 45 ? inst.substring(0, 45) + "…" : inst;
      if (!instMap[key]) {
        instMap[key] = { institution: key, papers: 0, researchTypes: new Set(), compounds: new Set() };
      }
      instMap[key].papers++;
      if (paper.research_type) instMap[key].researchTypes.add(paper.research_type.split(",")[0].trim());
      (paper.pfas_compounds || []).forEach(c => instMap[key].compounds.add(c));
    });

    const institutionData = Object.values(instMap)
      .map(d => ({
        institution: d.institution,
        papers: d.papers,
        diversity: d.researchTypes.size,
        compounds: d.compounds.size,
        // Impact score: papers * 1.5 + diversity * 2 + compounds * 0.5
        score: Math.round(d.papers * 1.5 + d.researchTypes.size * 2 + d.compounds.size * 0.5),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return { institutionData, topInstitution: institutionData[0] };
  }, [papers]);

  const maxScore = institutionData[0]?.score || 1;
  const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#d97706", "#16a34a"];

  return (
    <div className="space-y-6">
      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {institutionData.slice(0, 3).map((inst, i) => {
          const medals = ["🥇", "🥈", "🥉"];
          const bgColors = ["bg-amber-50 border-amber-200", "bg-slate-50 border-slate-200", "bg-orange-50 border-orange-200"];
          return (
            <Card key={inst.institution} className={`border ${bgColors[i]} shadow-sm`}>
              <CardContent className="pt-5 text-center">
                <div className="text-2xl mb-2">{medals[i]}</div>
                <p className="text-xs font-semibold text-slate-800 leading-tight mb-2">{inst.institution}</p>
                <p className="text-2xl font-bold text-teal-700">{inst.score}</p>
                <p className="text-xs text-slate-500">Impact Score</p>
                <div className="mt-2 flex justify-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{inst.papers}</span>
                  <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" />{inst.diversity} types</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full ranking chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Institutional Impact Rankings</CardTitle>
          <p className="text-sm text-slate-500">Score = (Papers × 1.5) + (Research Diversity × 2) + (Compounds × 0.5)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={institutionData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="institution" type="category" tick={{ fontSize: 10 }} width={180} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "score") return [value, "Impact Score"];
                  if (name === "papers") return [value, "Papers"];
                  return [value, name];
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="score">
                {institutionData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={1 - i * 0.04} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}