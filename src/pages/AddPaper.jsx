import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Save, Loader2, Upload, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const researchTypes = [
  "Environmental Monitoring", "Human Health", "Water Quality",
  "Soil Contamination", "Wildlife", "Treatment Technology", "Risk Assessment", "Review"
];

const commonCompounds = [
  "PFOA", "PFOS", "PFHxS", "PFNA", "PFDA", "PFUnA", "PFDoA",
  "PFBS", "PFHxA", "PFHpA", "GenX", "PFBA"
];

export default function AddPaper() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    authors: [],
    abstract: "",
    publication_year: new Date().getFullYear(),
    journal: "",
    doi: "",
    pfas_compounds: [],
    study_location: "",
    province: "",
    research_type: "",
    sample_matrix: [],
    key_findings: "",
    concentrations_reported: "",
    keywords: [],
    pdf_url: "",
    institution: ""
  });

  const [newAuthor, setNewAuthor] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newSample, setNewSample] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [extractedPapers, setExtractedPapers] = useState([]);

  const createMutation = useMutation({
    mutationFn: (papers) => base44.entities.ResearchPaper.bulkCreate(papers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      navigate(createPageUrl("Database"));
      toast.success(`${extractedPapers.length} papers added successfully`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (extractedPapers.length > 0) {
      createMutation.mutate(extractedPapers);
    } else {
      createMutation.mutate([formData]);
    }
  };

  const addToArray = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter("");
    }
  };

  const removeFromArray = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(v => v !== value)
    }));
  };

  const toggleCompound = (compound) => {
    if (formData.pfas_compounds.includes(compound)) {
      removeFromArray('pfas_compounds', compound);
    } else {
      setFormData(prev => ({
        ...prev,
        pfas_compounds: [...prev.pfas_compounds, compound]
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsExtracting(true);
    setUploadedFiles(files);
    const papers = [];

    try {
      toast.info(`Processing ${files.length} file(s)...`);
      
      for (const file of files) {
        try {
          // Upload file
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          // Extract data from file
          const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url,
            json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                authors: { type: "array", items: { type: "string" } },
                abstract: { type: "string" },
                publication_year: { type: "number" },
                journal: { type: "string" },
                doi: { type: "string" },
                pfas_compounds: { type: "array", items: { type: "string" } },
                study_location: { type: "string" },
                province: { type: "string" },
                research_type: { type: "string" },
                sample_matrix: { type: "array", items: { type: "string" } },
                key_findings: { type: "string" },
                concentrations_reported: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                institution: { type: "string" }
              }
            }
          });

          if (result.status === "success" && result.output) {
            papers.push({
              ...result.output,
              pdf_url: file_url,
              authors: result.output.authors || [],
              pfas_compounds: result.output.pfas_compounds || [],
              sample_matrix: result.output.sample_matrix || [],
              keywords: result.output.keywords || [],
              publication_year: result.output.publication_year || new Date().getFullYear()
            });
          }
        } catch (error) {
          toast.error(`Error processing ${file.name}: ${error.message}`);
        }
      }

      if (papers.length > 0) {
        setExtractedPapers(papers);
        toast.success(`Successfully extracted data from ${papers.length} paper(s)!`);
        
        // Automatically save the papers
        try {
          await base44.entities.ResearchPaper.bulkCreate(papers);
          queryClient.invalidateQueries({ queryKey: ['papers'] });
          toast.success(`${papers.length} paper(s) added to database!`);
          navigate(createPageUrl("Database"));
        } catch (error) {
          toast.error(`Failed to save papers: ${error.message}`);
        }
      } else {
        toast.error("No papers could be extracted");
      }
    } catch (error) {
      toast.error("Error processing files: " + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to={createPageUrl("Database")}>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 -ml-3 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Database
            </Button>
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Add Research Paper</h1>
          <p className="text-slate-600 mt-1">Add a new CECs research publication to the database</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* File Upload */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-white">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Paper Files</h3>
                <p className="text-sm text-slate-600 text-center mb-4 max-w-md">
                  Upload one or multiple PDF files and we'll automatically extract the paper details for you
                </p>
                
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isExtracting}
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting Data...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Choose Files
                      </>
                    )}
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                />
                
                {uploadedFiles.length > 0 && (
                  <div className="text-sm text-slate-500 mt-3 text-center">
                    <p className="font-medium">Uploaded {uploadedFiles.length} file(s)</p>
                    {extractedPapers.length > 0 && (
                      <p className="text-teal-600 font-medium mt-1">
                        ✓ {extractedPapers.length} paper(s) ready to add
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter the paper title"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label>Authors *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Add author name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('authors', newAuthor, setNewAuthor))}
                  />
                  <Button 
                    type="button"
                    onClick={() => addToArray('authors', newAuthor, setNewAuthor)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.authors.map((author, idx) => (
                    <Badge key={idx} variant="secondary" className="pl-3">
                      {author}
                      <button 
                        type="button"
                        onClick={() => removeFromArray('authors', author)}
                        className="ml-1.5 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="year">Publication Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, publication_year: parseInt(e.target.value) }))}
                    className="mt-1.5"
                    min="1990"
                    max="2030"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="journal">Journal</Label>
                  <Input
                    id="journal"
                    value={formData.journal}
                    onChange={(e) => setFormData(prev => ({ ...prev, journal: e.target.value }))}
                    placeholder="Journal name"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => setFormData(prev => ({ ...prev, doi: e.target.value }))}
                    placeholder="10.xxxx/xxxxx"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="Research institution"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="abstract">Abstract</Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                  placeholder="Paper abstract"
                  className="mt-1.5 min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Research Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Research Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Research Type</Label>
                  <Select
                    value={formData.research_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, research_type: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {researchTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Study Location</Label>
                <Input
                  id="location"
                  value={formData.study_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, study_location: e.target.value }))}
                  placeholder="Specific location of study"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>PFAS Compounds Studied</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonCompounds.map(compound => (
                    <button
                      key={compound}
                      type="button"
                      onClick={() => toggleCompound(compound)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.pfas_compounds.includes(compound)
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {compound}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Sample Types</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newSample}
                    onChange={(e) => setNewSample(e.target.value)}
                    placeholder="e.g., water, soil, blood"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('sample_matrix', newSample, setNewSample))}
                  />
                  <Button 
                    type="button"
                    onClick={() => addToArray('sample_matrix', newSample, setNewSample)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sample_matrix.map((sample, idx) => (
                    <Badge key={idx} variant="outline">
                      {sample}
                      <button 
                        type="button"
                        onClick={() => removeFromArray('sample_matrix', sample)}
                        className="ml-1.5 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Findings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Findings & Keywords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="findings">Key Findings</Label>
                <Textarea
                  id="findings"
                  value={formData.key_findings}
                  onChange={(e) => setFormData(prev => ({ ...prev, key_findings: e.target.value }))}
                  placeholder="Summary of main findings"
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="concentrations">Reported Concentrations</Label>
                <Textarea
                  id="concentrations"
                  value={formData.concentrations_reported}
                  onChange={(e) => setFormData(prev => ({ ...prev, concentrations_reported: e.target.value }))}
                  placeholder="PFAS concentration ranges found"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('keywords', newKeyword, setNewKeyword))}
                  />
                  <Button 
                    type="button"
                    onClick={() => addToArray('keywords', newKeyword, setNewKeyword)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                      <button 
                        type="button"
                        onClick={() => removeFromArray('keywords', keyword)}
                        className="ml-1.5 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="pdf">PDF URL</Label>
                <Input
                  id="pdf"
                  value={formData.pdf_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link to={createPageUrl("Database")}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {extractedPapers.length > 0 ? `Save ${extractedPapers.length} Paper(s)` : 'Save Paper'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}