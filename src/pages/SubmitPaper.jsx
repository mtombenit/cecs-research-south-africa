import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, CheckCircle2, FileUp } from "lucide-react";
import { toast } from "sonner";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const RESEARCH_TYPES = [
  "Environmental Monitoring", "Human Health", "Water Quality",
  "Soil Contamination", "Wildlife", "Treatment Technology",
  "Risk Assessment", "Review"
];

export default function SubmitPaper() {
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    abstract: "",
    publication_year: "",
    journal: "",
    doi: "",
    pfas_compounds: "",
    study_location: "",
    province: "",
    research_type: "",
    sample_matrix: "",
    key_findings: "",
    concentrations_reported: "",
    keywords: "",
    institution: ""
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.PaperSubmission.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paperSubmissions'] });
      setSubmitted(true);
      toast.success("Paper submitted for review!");
    },
    onError: (error) => {
      toast.error("Failed to submit paper. Please try again.");
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setUploading(true);
    let pdfUrl = "";

    try {
      if (pdfFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
        pdfUrl = uploadResult.file_url;
      }

      const submissionData = {
        ...formData,
        authors: formData.authors.split(",").map(a => a.trim()).filter(Boolean),
        pfas_compounds: formData.pfas_compounds.split(",").map(c => c.trim()).filter(Boolean),
        sample_matrix: formData.sample_matrix.split(",").map(s => s.trim()).filter(Boolean),
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
        publication_year: parseInt(formData.publication_year),
        pdf_url: pdfUrl,
        status: "pending"
      };

      await submitMutation.mutateAsync(submissionData);
    } catch (error) {
      toast.error("Failed to upload file or submit paper");
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for contributing to the database. Your paper submission is now under review and will be published once approved by our team.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Submit Another
              </Button>
              <Button onClick={() => window.location.href = "/"}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Research Paper</h1>
          <p className="text-slate-600">
            Contribute to the South African CECs research database by submitting a paper for review
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Paper Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter paper title"
                />
              </div>

              {/* Authors */}
              <div>
                <Label htmlFor="authors">Authors * (comma-separated)</Label>
                <Input
                  id="authors"
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  required
                  placeholder="e.g., Smith J, Johnson A, Williams B"
                />
              </div>

              {/* Publication Year & Journal */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Publication Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="journal">Journal</Label>
                  <Input
                    id="journal"
                    value={formData.journal}
                    onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                    placeholder="Journal name"
                  />
                </div>
              </div>

              {/* DOI */}
              <div>
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  placeholder="e.g., 10.1000/xyz123"
                />
              </div>

              {/* Abstract */}
              <div>
                <Label htmlFor="abstract">Abstract</Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  rows={6}
                  placeholder="Enter paper abstract"
                />
              </div>

              {/* Province & Research Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="researchType">Research Type</Label>
                  <Select value={formData.research_type} onValueChange={(value) => setFormData({ ...formData, research_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select research type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESEARCH_TYPES.map(rt => (
                        <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Study Location & Institution */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Study Location</Label>
                  <Input
                    id="location"
                    value={formData.study_location}
                    onChange={(e) => setFormData({ ...formData, study_location: e.target.value })}
                    placeholder="Specific location"
                  />
                </div>
                <div>
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="Research institution"
                  />
                </div>
              </div>

              {/* PFAS Compounds */}
              <div>
                <Label htmlFor="compounds">PFAS/CEC Compounds (comma-separated)</Label>
                <Input
                  id="compounds"
                  value={formData.pfas_compounds}
                  onChange={(e) => setFormData({ ...formData, pfas_compounds: e.target.value })}
                  placeholder="e.g., PFOA, PFOS, PFHxS"
                />
              </div>

              {/* Sample Matrix */}
              <div>
                <Label htmlFor="samples">Sample Matrix (comma-separated)</Label>
                <Input
                  id="samples"
                  value={formData.sample_matrix}
                  onChange={(e) => setFormData({ ...formData, sample_matrix: e.target.value })}
                  placeholder="e.g., water, soil, blood"
                />
              </div>

              {/* Key Findings */}
              <div>
                <Label htmlFor="findings">Key Findings</Label>
                <Textarea
                  id="findings"
                  value={formData.key_findings}
                  onChange={(e) => setFormData({ ...formData, key_findings: e.target.value })}
                  rows={4}
                  placeholder="Summary of key findings"
                />
              </div>

              {/* Concentrations */}
              <div>
                <Label htmlFor="concentrations">Concentrations Reported</Label>
                <Input
                  id="concentrations"
                  value={formData.concentrations_reported}
                  onChange={(e) => setFormData({ ...formData, concentrations_reported: e.target.value })}
                  placeholder="e.g., 5-50 ng/L"
                />
              </div>

              {/* Keywords */}
              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="e.g., PFAS, contamination, groundwater"
                />
              </div>

              {/* PDF Upload */}
              <div>
                <Label htmlFor="pdf">Upload PDF (optional)</Label>
                <div className="mt-2">
                  <label htmlFor="pdf" className="flex items-center justify-center w-full h-32 px-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-colors">
                    <div className="text-center">
                      <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">
                        {pdfFile ? pdfFile.name : "Click to upload PDF"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF only</p>
                    </div>
                    <input
                      id="pdf"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading || submitMutation.isPending}>
                  {uploading || submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}