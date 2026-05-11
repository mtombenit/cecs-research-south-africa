import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Save, X, Calendar, MapPin, Download } from "lucide-react";

const researchTypeColors = {
  "Environmental Monitoring": "bg-emerald-100 text-emerald-700",
  "Human Health": "bg-rose-100 text-rose-700",
  "Water Quality": "bg-blue-100 text-blue-700",
  "Soil Contamination": "bg-amber-100 text-amber-700",
  "Wildlife": "bg-green-100 text-green-700",
  "Treatment Technology": "bg-purple-100 text-purple-700",
  "Risk Assessment": "bg-orange-100 text-orange-700",
  "Review": "bg-slate-100 text-slate-700",
};

export default function SavedPaperCard({ savedPaper, paper, onRemove, onSaveNotes }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(savedPaper.notes || "");

  const handleSave = () => {
    onSaveNotes(savedPaper.id, tempNotes);
    setIsEditing(false);
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <Link to={createPageUrl(`PaperDetail?id=${paper.id}`)}>
              <h3 className="text-lg font-semibold text-slate-900 hover:text-teal-600 transition-colors line-clamp-2">
                {paper.title}
              </h3>
            </Link>
            <p className="text-sm text-slate-600 mt-1">
              {paper.authors?.slice(0, 3).join(", ")}
              {paper.authors?.length > 3 && " et al."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-red-600"
            onClick={() => {
              if (confirm("Remove this paper from the collection?")) {
                onRemove(savedPaper.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          {paper.research_type && (
            <Badge className={`${researchTypeColors[paper.research_type]} border-0`}>
              {paper.research_type}
            </Badge>
          )}
          <span className="text-xs text-slate-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {paper.publication_year}
          </span>
          {paper.province && (
            <span className="text-xs text-slate-500 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {paper.province}
            </span>
          )}
          <a
            href={paper.pdf_url || `https://sci-hub.se/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-600 hover:text-teal-700 flex items-center"
          >
            <Download className="w-3 h-3 mr-1" />
            Download PDF
          </a>
        </div>

        {paper.abstract && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{paper.abstract}</p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Your Notes</span>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempNotes(savedPaper.notes || "");
                  setIsEditing(true);
                }}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSave}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add your thoughts, key takeaways, or reminders..."
              className="text-sm"
              rows={3}
            />
          ) : (
            <p className="text-sm text-slate-600 italic">
              {savedPaper.notes || "No notes yet. Click Edit to add your thoughts."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}