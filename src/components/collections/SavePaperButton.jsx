import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { value: "teal", class: "bg-teal-100 text-teal-700 border-teal-300" },
  { value: "blue", class: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "purple", class: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "pink", class: "bg-pink-100 text-pink-700 border-pink-300" },
  { value: "green", class: "bg-green-100 text-green-700 border-green-300" },
  { value: "orange", class: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "red", class: "bg-red-100 text-red-700 border-red-300" },
];

export default function SavePaperButton({ paperId, variant = "ghost", size = "sm" }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("teal");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections', user?.email],
    queryFn: () => base44.entities.Collection.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: savedPapers = [] } = useQuery({
    queryKey: ['savedPapers', user?.email, paperId],
    queryFn: () => base44.entities.SavedPaper.filter({ 
      created_by: user.email,
      paper_id: paperId 
    }),
    enabled: !!user && !!paperId,
  });

  const createCollectionMutation = useMutation({
    mutationFn: (data) => base44.entities.Collection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNewCollectionName("");
      setNewCollectionDesc("");
      setNewCollectionColor("teal");
      setShowNewCollection(false);
      toast.success("Collection created");
    },
  });

  const savePaperMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedPaper.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPapers'] });
      toast.success("Paper saved to collection");
      setNotes("");
      setOpen(false);
    },
  });

  const removePaperMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedPaper.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPapers'] });
      toast.success("Paper removed from collection");
    },
  });

  const handleSaveToCollection = (collectionId) => {
    savePaperMutation.mutate({
      paper_id: paperId,
      collection_id: collectionId,
      notes: notes.trim() || undefined,
    });
  };

  const handleCreateAndSave = () => {
    if (!newCollectionName.trim()) return;
    createCollectionMutation.mutate({
      name: newCollectionName,
      description: newCollectionDesc,
      color: newCollectionColor,
    });
  };

  const isInCollection = (collectionId) => {
    return savedPapers.some(sp => sp.collection_id === collectionId);
  };

  const isSaved = savedPapers.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={isSaved ? "text-teal-600" : ""}>
          <Bookmark className={`w-4 h-4 mr-1.5 ${isSaved ? "fill-teal-600" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
          <DialogDescription>
            Add this paper to one of your collections with optional notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Notes */}
          <div>
            <Label htmlFor="notes">Personal Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your thoughts, key takeaways, or reminders..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          {/* Collections List */}
          <div>
            <Label>Select Collection</Label>
            <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
              {collections.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No collections yet. Create your first one below.
                </p>
              ) : (
                collections.map((collection) => {
                  const saved = isInCollection(collection.id);
                  const colorClass = COLOR_OPTIONS.find(c => c.value === collection.color)?.class || COLOR_OPTIONS[0].class;
                  
                  return (
                    <button
                      key={collection.id}
                      onClick={() => {
                        if (saved) {
                          const savedPaper = savedPapers.find(sp => sp.collection_id === collection.id);
                          if (savedPaper) removePaperMutation.mutate(savedPaper.id);
                        } else {
                          handleSaveToCollection(collection.id);
                        }
                      }}
                      disabled={savePaperMutation.isPending || removePaperMutation.isPending}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        saved 
                          ? `${colorClass} border-current` 
                          : 'bg-white border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-medium">{collection.name}</p>
                        {collection.description && (
                          <p className="text-xs text-slate-600 mt-0.5">{collection.description}</p>
                        )}
                      </div>
                      {saved && <Check className="w-5 h-5" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* New Collection */}
          {showNewCollection ? (
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="newName">Collection Name</Label>
                <Input
                  id="newName"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g., Water Quality Studies"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="newDesc">Description (Optional)</Label>
                <Input
                  id="newDesc"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  placeholder="What's this collection about?"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewCollectionColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                        newCollectionColor === color.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateAndSave}
                  disabled={!newCollectionName.trim() || createCollectionMutation.isPending}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {createCollectionMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    "Create Collection"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewCollection(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowNewCollection(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Collection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}