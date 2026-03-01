import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, TrendingUp, AlertCircle, CheckCircle2, BarChart2 } from "lucide-react";

export default function PaperAIInsights({ paper }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paper) return;
    generateInsights();
  }, [paper?.id]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    const contentSection = paper.markdown_content
      ? `\n\nFull Paper Content (Markdown):\n${paper.markdown_content.slice(0, 8000)}`
      : `\nAbstract: ${paper.abstract || "N/A"}\nKey Findings: ${paper.key_findings || "N/A"}\nConcentrations Reported: ${paper.concentrations_reported || "N/A"}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert analyst of PFAS and environmental research papers. Analyze the following research paper and provide structured insights.

Paper Title: ${paper.title}
Authors: ${paper.authors?.join(", ")}
Year: ${paper.publication_year}
Journal: ${paper.journal || "N/A"}
PFAS Compounds: ${paper.pfas_compounds?.join(", ") || "N/A"}
Sample Matrix: ${paper.sample_matrix?.join(", ") || "N/A"}
Research Type: ${paper.research_type || "N/A"}
Province: ${paper.province || "N/A"}
Study Location: ${paper.study_location || "N/A"}${contentSection}

Provide:
1. A concise 2-3 sentence plain-language summary of what this paper is about and why it matters.
2. 3-4 key analytical highlights (short bullet points) about significance, methodology, or findings.
3. A significance rating (Low / Medium / High / Critical) based on public health or environmental impact, with a one-line reason.
4. 2 research gaps or future directions suggested by this paper.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          significance: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
          significance_reason: { type: "string" },
          research_gaps: { type: "array", items: { type: "string" } }
        }
      }
    });
    setInsights(result);
    setLoading(false);
  };

  const significanceColors = {
    Low: "bg-slate-100 text-slate-600",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700"
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          AI Summary & Analytics
        </h2>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-sm">Analysing paper...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500 text-sm py-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : insights ? (
          <div className="space-y-5">
            {/* Summary */}
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Plain-Language Summary</p>
              <p className="text-slate-700 leading-relaxed text-sm">{insights.summary}</p>
            </div>

            {/* Significance */}
            {insights.significance && (
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Significance</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${significanceColors[insights.significance]}`}>
                    {insights.significance}
                  </span>
                  <span className="text-sm text-slate-600">{insights.significance_reason}</span>
                </div>
              </div>
            )}

            {/* Highlights */}
            {insights.highlights?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <BarChart2 className="w-4 h-4" /> Key Analytical Highlights
                </p>
                <ul className="space-y-1.5">
                  {insights.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Research Gaps */}
            {insights.research_gaps?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Research Gaps & Future Directions
                </p>
                <ul className="space-y-1.5">
                  {insights.research_gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 italic">
                      <span className="text-teal-500 font-bold mt-0.5">→</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}