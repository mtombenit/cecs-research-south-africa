import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function DeleteDuplicateButton({ paperId, paperTitle }) {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ResearchPaper.delete(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      toast.success("Duplicate paper deleted successfully");
      setShowDialog(false);
    },
    onError: () => {
      toast.error("Failed to delete paper");
    }
  });

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDialog(true);
        }}
        className="gap-1"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Duplicate
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Duplicate Paper?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this duplicate entry?</p>
              <p className="font-medium text-slate-900 text-sm">{paperTitle}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}