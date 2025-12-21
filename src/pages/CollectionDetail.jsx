import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, FileText, Trash2, Edit2, Save, X, Calendar, MapPin, Download
} from "lucide-react";
import { toast } from "sonner";

export default function CollectionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const collectionId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const collections = await base44.entities.Collection.filter({ id: collectionId });
      return collections[0];
    },
    enabled: !!collectionId,
  });

  const { data: savedPapers = [], isLoading: papersLoading } = useQuery({
    queryKey: ['savedPapers', collectionId],
    queryFn: () => base44.entities.SavedPaper.filter({ collection_id: collectionId }),
    enabled: !!collectionId,
  });

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.SavedPaper.update(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPapers'] });
      toast.success("Notes updated");
    },
  });

  const removePaperMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedPaper.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPapers'] });
      toast.success("Paper removed from collection");
    },
  });

  const [editingNotes, setEditingNotes] = useState({});

  const handleSaveNotes = (savedPaperId, notes) => {
    updateNotesMutation.mutate({ id: savedPaperId, notes });
    setEditingNotes(prev => ({ ...prev, [savedPaperId]: false }));
  };

  if (collectionLoading || papersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Collection not found</h2>
        <Link to={createPageUrl("Collections")}>
          <Button variant="outline">Back to Collections</Button>
        </Link>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to={createPageUrl("Collections")}>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 -ml-3 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collections
            </Button>
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{collection.name}</h1>
          {collection.description && (
            <p className="text-slate-600 mt-1">{collection.description}</p>
          )}
          <p className="text-sm text-slate-500 mt-2">
            {savedPapers.length} {savedPapers.length === 1 ? 'paper' : 'papers'} saved
          </p>
        </div>
      </div>

      {/* Papers List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedPapers.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Papers Yet</h3>
              <p className="text-slate-500 mb-6">
                Start adding papers to this collection from the database
              </p>
              <Link to={createPageUrl("Database")}>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  Browse Database
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {savedPapers.map((savedPaper) => {
              const paper = papers.find(p => p.id === savedPaper.paper_id);
              if (!paper) return null;

              const isEditing = editingNotes[savedPaper.id];
              const [tempNotes, setTempNotes] = useState(savedPaper.notes || "");

              return (
                <Card key={savedPaper.id} className="border-0 shadow-sm hover:shadow-md transition-all">
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
                            removePaperMutation.mutate(savedPaper.id);
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
                      {(paper.pdf_url || paper.doi) && (
                        <a 
                          href={paper.pdf_url || `https://sci-hub.se/${paper.doi}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:text-teal-700 flex items-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download PDF
                        </a>
                      )}
                    </div>

                    {paper.abstract && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                        {paper.abstract}
                      </p>
                    )}

                    {/* Personal Notes Section */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Your Notes</span>
                        {!isEditing ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNotes(prev => ({ ...prev, [savedPaper.id]: true }));
                              setTempNotes(savedPaper.notes || "");
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveNotes(savedPaper.id, tempNotes)}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingNotes(prev => ({ ...prev, [savedPaper.id]: false }))}
                            >
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}