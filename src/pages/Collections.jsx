import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bookmark, Plus, Folder, Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { value: "teal", class: "from-teal-500 to-teal-600", textClass: "text-teal-700" },
  { value: "blue", class: "from-blue-500 to-blue-600", textClass: "text-blue-700" },
  { value: "purple", class: "from-purple-500 to-purple-600", textClass: "text-purple-700" },
  { value: "pink", class: "from-pink-500 to-pink-600", textClass: "text-pink-700" },
  { value: "green", class: "from-green-500 to-green-600", textClass: "text-green-700" },
  { value: "orange", class: "from-orange-500 to-orange-600", textClass: "text-orange-700" },
  { value: "red", class: "from-red-500 to-red-600", textClass: "text-red-700" },
];

export default function Collections() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("teal");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections', user?.email],
    queryFn: () => base44.entities.Collection.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: allSavedPapers = [] } = useQuery({
    queryKey: ['allSavedPapers', user?.email],
    queryFn: () => base44.entities.SavedPaper.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Collection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setName("");
      setDescription("");
      setColor("teal");
      setShowCreate(false);
      toast.success("Collection created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (collectionId) => {
      // Delete all saved papers in this collection first
      const papersInCollection = allSavedPapers.filter(sp => sp.collection_id === collectionId);
      await Promise.all(papersInCollection.map(sp => base44.entities.SavedPaper.delete(sp.id)));
      // Then delete the collection
      await base44.entities.Collection.delete(collectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['allSavedPapers'] });
      toast.success("Collection deleted");
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({ name, description, color });
  };

  const getCollectionCount = (collectionId) => {
    return allSavedPapers.filter(sp => sp.collection_id === collectionId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-teal-600" />
                My Collections
              </h1>
              <p className="text-slate-600">
                Organize and manage your saved research papers
              </p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                  <DialogDescription>
                    Organize your research papers into themed collections
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Collection Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Water Quality Studies"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this collection about?"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Color Theme</Label>
                    <div className="flex gap-2 mt-2">
                      {COLOR_OPTIONS.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          type="button"
                          onClick={() => setColor(colorOption.value)}
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorOption.class} ${
                            color === colorOption.value ? 'ring-4 ring-offset-2 ring-slate-300' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={!name.trim() || createMutation.isPending}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {createMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      "Create Collection"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {collections.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center">
                <Folder className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Collections Yet</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Start organizing your research by creating your first collection
              </p>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const colorOption = COLOR_OPTIONS.find(c => c.value === collection.color) || COLOR_OPTIONS[0];
              const count = getCollectionCount(collection.id);
              
              return (
                <Link key={collection.id} to={createPageUrl(`CollectionDetail?id=${collection.id}`)}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all group h-full">
                    <CardHeader className={`bg-gradient-to-br ${colorOption.class} text-white`}>
                      <div className="flex items-start justify-between">
                        <Folder className="w-8 h-8 mb-2" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm(`Delete "${collection.name}"? This will remove all saved papers in this collection.`)) {
                              deleteMutation.mutate(collection.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-xl">{collection.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {collection.description && (
                        <p className="text-sm text-slate-600 mb-4">{collection.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          {count} {count === 1 ? 'paper' : 'papers'}
                        </span>
                        <span className={`text-sm font-medium ${colorOption.textClass}`}>
                          View →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}