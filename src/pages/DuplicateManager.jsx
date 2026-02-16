import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DuplicateManager() {
  const [isScanning, setIsScanning] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-created_date', 1000),
  });

  useState(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ResearchPaper.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast.success("Paper deleted");
    },
  });

  const deleteAllDuplicatesMutation = useMutation({
    mutationFn: async (duplicateIds) => {
      for (const id of duplicateIds) {
        await base44.entities.ResearchPaper.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      setDuplicateGroups([]);
      toast.success("All duplicates deleted");
    },
  });

  const scanForDuplicates = async () => {
    setIsScanning(true);
    toast.info("Scanning for duplicates...");
    
    try {
      const groups = [];
      const processed = new Set();

      for (let i = 0; i < papers.length; i++) {
        if (processed.has(papers[i].id)) continue;
        
        const paper1 = papers[i];
        const duplicates = [];

        for (let j = i + 1; j < papers.length; j++) {
          if (processed.has(papers[j].id)) continue;
          
          const paper2 = papers[j];
          
          // Calculate title similarity using LLM
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Compare these two paper titles and determine their similarity percentage (0-100).

Title 1: ${paper1.title}
Title 2: ${paper2.title}

Return only the similarity percentage as a number.`,
            response_json_schema: {
              type: "object",
              properties: {
                similarity: { type: "number" }
              }
            }
          });

          if (result.similarity >= 95) {
            duplicates.push(paper2);
            processed.add(paper2.id);
          }
        }

        if (duplicates.length > 0) {
          groups.push({
            original: paper1,
            duplicates: duplicates
          });
          processed.add(paper1.id);
        }
      }

      setDuplicateGroups(groups);
      toast.success(`Found ${groups.length} duplicate group(s)`);
    } catch (error) {
      console.error("Error scanning for duplicates:", error);
      toast.error("Error scanning for duplicates");
    } finally {
      setIsScanning(false);
    }
  };

  const getAllDuplicateIds = () => {
    return duplicateGroups.flatMap(group => group.duplicates.map(d => d.id));
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
              <p className="text-slate-600">Only administrators can access duplicate management.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Duplicate Manager</h1>
            <p className="text-slate-600">Scan and remove duplicate papers from the database</p>
          </div>
          <Button
            onClick={scanForDuplicates}
            disabled={isScanning}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scan for Duplicates
              </>
            )}
          </Button>
        </div>

        {duplicateGroups.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-slate-900">
                    {getAllDuplicateIds().length} duplicate(s) found in {duplicateGroups.length} group(s)
                  </span>
                </div>
                <Button
                  onClick={() => deleteAllDuplicatesMutation.mutate(getAllDuplicateIds())}
                  disabled={deleteAllDuplicatesMutation.isPending}
                  variant="destructive"
                >
                  {deleteAllDuplicatesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Duplicates
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {duplicateGroups.length === 0 && !isScanning && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No duplicates found</h3>
              <p className="text-slate-600 mb-6">Click "Scan for Duplicates" to check for duplicate papers</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {duplicateGroups.map((group, groupIdx) => (
            <Card key={groupIdx} className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Duplicate Group {groupIdx + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original Paper */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge className="bg-teal-600 text-white mb-2">Original</Badge>
                      <Link 
                        to={createPageUrl(`PaperDetail?id=${group.original.id}`)}
                        className="text-lg font-semibold text-teal-700 hover:text-teal-800 block mb-1"
                      >
                        {group.original.title}
                      </Link>
                      <p className="text-sm text-slate-600">
                        {group.original.authors?.join(', ')} • {group.original.publication_year}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duplicates */}
                {group.duplicates.map((duplicate) => (
                  <div key={duplicate.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Badge variant="destructive" className="mb-2">Duplicate</Badge>
                        <Link 
                          to={createPageUrl(`PaperDetail?id=${duplicate.id}`)}
                          className="text-lg font-semibold text-slate-900 hover:text-slate-700 block mb-1"
                        >
                          {duplicate.title}
                        </Link>
                        <p className="text-sm text-slate-600">
                          {duplicate.authors?.join(', ')} • {duplicate.publication_year}
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteMutation.mutate(duplicate.id)}
                        disabled={deleteMutation.isPending}
                        variant="destructive"
                        size="sm"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}