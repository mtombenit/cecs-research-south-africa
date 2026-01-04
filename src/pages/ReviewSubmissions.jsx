import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Eye, FileText, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export default function ReviewSubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  // Fetch current user
  useState(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['paperSubmissions'],
    queryFn: () => base44.entities.PaperSubmission.list('-created_date', 100),
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PaperSubmission.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paperSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      setSelectedSubmission(null);
      setReviewerNotes("");
    }
  });

  const createPaperMutation = useMutation({
    mutationFn: async (paperData) => {
      return await base44.entities.ResearchPaper.create(paperData);
    }
  });

  const handleApprove = async () => {
    if (!selectedSubmission || !user) return;
    
    setIsApproving(true);
    try {
      // Create the research paper
      const paperData = {
        title: selectedSubmission.title,
        authors: selectedSubmission.authors,
        abstract: selectedSubmission.abstract,
        publication_year: selectedSubmission.publication_year,
        journal: selectedSubmission.journal,
        doi: selectedSubmission.doi,
        pfas_compounds: selectedSubmission.pfas_compounds,
        study_location: selectedSubmission.study_location,
        province: selectedSubmission.province,
        research_type: selectedSubmission.research_type,
        sample_matrix: selectedSubmission.sample_matrix,
        key_findings: selectedSubmission.key_findings,
        concentrations_reported: selectedSubmission.concentrations_reported,
        keywords: selectedSubmission.keywords,
        pdf_url: selectedSubmission.pdf_url,
        institution: selectedSubmission.institution,
        status: "open_access"
      };

      await createPaperMutation.mutateAsync(paperData);

      // Update submission status
      await updateSubmissionMutation.mutateAsync({
        id: selectedSubmission.id,
        data: {
          status: "approved",
          reviewer_notes: reviewerNotes,
          reviewed_by: user.email,
          reviewed_date: new Date().toISOString()
        }
      });

      toast.success("Paper approved and added to database!");
    } catch (error) {
      toast.error("Failed to approve submission");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !user) return;

    try {
      await updateSubmissionMutation.mutateAsync({
        id: selectedSubmission.id,
        data: {
          status: "rejected",
          reviewer_notes: reviewerNotes,
          reviewed_by: user.email,
          reviewed_date: new Date().toISOString()
        }
      });

      toast.success("Submission rejected");
    } catch (error) {
      toast.error("Failed to reject submission");
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === "pending");
  const reviewedSubmissions = submissions.filter(s => s.status !== "pending");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Paper Submissions</h1>
          <p className="text-slate-600">
            Review and approve community-submitted research papers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Submissions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Pending Review ({pendingSubmissions.length})
          </h2>
          {pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No pending submissions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                          <span className="text-sm text-slate-500">
                            Submitted by {submission.created_by}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {submission.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {submission.authors?.join(", ")}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {submission.publication_year}
                          </span>
                        </div>
                        {submission.abstract && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {submission.abstract}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setReviewerNotes("");
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reviewed Submissions */}
        {reviewedSubmissions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Recently Reviewed ({reviewedSubmissions.length})
            </h2>
            <div className="grid gap-4">
              {reviewedSubmissions.map((submission) => (
                <Card key={submission.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={submission.status === "approved" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"}>
                            {submission.status === "approved" ? "Approved" : "Rejected"}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            by {submission.reviewed_by}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {submission.title}
                        </h3>
                        {submission.reviewer_notes && (
                          <p className="text-sm text-slate-600 italic">
                            Note: {submission.reviewer_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedSubmission.title}</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Authors:</strong> {selectedSubmission.authors?.join(", ")}</p>
                  <p><strong>Year:</strong> {selectedSubmission.publication_year}</p>
                  {selectedSubmission.journal && <p><strong>Journal:</strong> {selectedSubmission.journal}</p>}
                  {selectedSubmission.doi && <p><strong>DOI:</strong> {selectedSubmission.doi}</p>}
                  {selectedSubmission.province && <p><strong>Province:</strong> {selectedSubmission.province}</p>}
                  {selectedSubmission.research_type && <p><strong>Research Type:</strong> {selectedSubmission.research_type}</p>}
                  {selectedSubmission.institution && <p><strong>Institution:</strong> {selectedSubmission.institution}</p>}
                </div>
              </div>

              {selectedSubmission.abstract && (
                <div>
                  <strong className="text-sm">Abstract:</strong>
                  <p className="text-sm text-slate-600 mt-1">{selectedSubmission.abstract}</p>
                </div>
              )}

              {selectedSubmission.key_findings && (
                <div>
                  <strong className="text-sm">Key Findings:</strong>
                  <p className="text-sm text-slate-600 mt-1">{selectedSubmission.key_findings}</p>
                </div>
              )}

              {selectedSubmission.pfas_compounds?.length > 0 && (
                <div>
                  <strong className="text-sm">Compounds:</strong>
                  <p className="text-sm text-slate-600 mt-1">{selectedSubmission.pfas_compounds.join(", ")}</p>
                </div>
              )}

              {selectedSubmission.pdf_url && (
                <div>
                  <Button variant="outline" size="sm" onClick={() => window.open(selectedSubmission.pdf_url, '_blank')}>
                    <FileText className="w-4 h-4 mr-2" />
                    View PDF
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Reviewer Notes</Label>
                <Textarea
                  id="notes"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this submission..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateSubmissionMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving || updateSubmissionMutation.isPending || createPaperMutation.isPending}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}