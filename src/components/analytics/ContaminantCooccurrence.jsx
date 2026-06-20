import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ContaminantCooccurrence({ papers }) {
  const data = useMemo(() => {
    const pairCounts = {};
    papers.forEach(paper => {
      const compounds = paper.pfas_compounds || [];
      for (let i = 0; i < compounds.length; i++) {
        for (let j = i + 1; j < compounds.length; j++) {
          const pair = [compounds[i], compounds[j]].sort().join(" + ");
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        }
      }
    });
    return Object.entries(pairCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([pair, count]) => ({ pair, count }));
  }, [papers]);

  // Also compute top single compounds
  const singleData = useMemo(() => {
    const counts = {};
    papers.forEach(paper => {
      (paper.pfas_compounds || []).forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([compound, count]) => ({ compound, count }));
  }, [papers]);

  const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#d97706", "#16a34a", "#dc2626", "#2563eb", "#9333ea", "#c2410c", "#0f766e", "#1d4ed8"];

  if (data.length === 0 && singleData.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Contaminant Co-occurrence</CardTitle></CardHeader>
        <CardContent><p className="text-slate-500 text-sm">No compound data available.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Top Single Contaminants</CardTitle>
          <p className="text-sm text-slate-500">Most frequently studied PFAS compounds</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={singleData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="compound" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v) => [v, "Papers"]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {singleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Co-occurrence Pairs</CardTitle>
          <p className="text-sm text-slate-500">Contaminants found together in the same study</p>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-slate-500 text-sm">Not enough multi-compound studies for pair analysis.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="pair" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v) => [v, "Co-occurrences"]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}