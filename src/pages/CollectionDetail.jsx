import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import SavedPaperCard from "@/components/collections/SavedPaperCard";

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

  const handleSaveNotes = (savedPaperId, notes) => {
    updateNotesMutation.mutate({ id: savedPaperId, notes });
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
              return (
                <SavedPaperCard
                  key={savedPaper.id}
                  savedPaper={savedPaper}
                  paper={paper}
                  onRemove={(id) => removePaperMutation.mutate(id)}
                  onSaveNotes={handleSaveNotes}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}