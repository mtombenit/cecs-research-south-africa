import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  
  const { data: existingPapers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });
  
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
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

  const checkDuplicate = async (newPaper) => {
    if (!newPaper.title || !newPaper.abstract) return { isDuplicate: false };

    for (const existing of existingPapers) {
      if (!existing.title || !existing.abstract) continue;

      // Quick check: exact title match
      if (existing.title.toLowerCase() === newPaper.title.toLowerCase()) {
        return { isDuplicate: true, title: existing.title };
      }

      // Quick check: same DOI
      if (existing.doi && newPaper.doi && existing.doi === newPaper.doi) {
        return { isDuplicate: true, title: existing.title };
      }

      // AI similarity check for close matches
      try {
        const prompt = `Compare these two research papers and determine if they are the same paper or duplicates. Return a similarity percentage (0-100).

  Paper 1:
  Title: ${existing.title}
  Authors: ${existing.authors?.join(', ')}
  Abstract: ${existing.abstract?.substring(0, 300)}

  Paper 2:
  Title: ${newPaper.title}
  Authors: ${newPaper.authors?.join(', ')}
  Abstract: ${newPaper.abstract?.substring(0, 300)}

  Return only the similarity percentage as a number between 0 and 100.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              similarity_percentage: { type: "number" }
            }
          }
        });

        if (result.similarity_percentage > 90) {
          return { isDuplicate: true, title: existing.title };
        }
      } catch (error) {
        console.error('Error checking similarity:', error);
      }
    }

    return { isDuplicate: false };
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsExtracting(true);
    setUploadProgress(0);
    setUploadStatus("Uploading files...");
    setUploadedFiles(files);

    try {
      toast.info(`Uploading ${files.length} file(s)...`);

      // Quick upload phase - save to temp storage immediately
      const pendingPapers = [];
      const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNum = i + 1;
        
        try {
          // Check file size
          if (file.size > maxFileSize) {
            toast.error(`${file.name} exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            continue;
          }
          
          setUploadStatus(`Uploading ${file.name} (${fileNum}/${files.length})`);
          setUploadProgress((fileNum / files.length) * 100);
          
          // Upload file
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          // Save to temp storage immediately
          const pending = await base44.entities.PendingPaper.create({
            filename: file.name,
            file_url: file_url,
            status: "uploading",
            progress: 10
          });
          
          pendingPapers.push(pending);
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      setUploadStatus("Upload complete! Processing in background...");
      setUploadProgress(100);
      toast.success(`${pendingPapers.length} file(s) uploaded! Processing in background...`);

      // Navigate to database to see processing
      setTimeout(() => {
        navigate(createPageUrl("Database"));
      }, 1500);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error("Error uploading files: " + error.message);
    } finally {
      setTimeout(() => {
        setIsExtracting(false);
        setUploadProgress(0);
        setUploadStatus("");
      }, 2000);
      e.target.value = '';
    }
  };

  // Old slow code removed - replaced with fast upload above
  const handleFileUpload_OLD = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsExtracting(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");
    setUploadedFiles(files);
    const papers = [];
    let duplicatesFound = 0;
    let extractionErrors = 0;
    const totalFiles = files.length;

    try {
      toast.info(`Processing ${files.length} file(s)...`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNum = i + 1;
        try {
          setUploadStatus(`Uploading ${file.name} (${fileNum}/${totalFiles})`);
          setUploadProgress((fileNum - 0.7) / totalFiles * 100);
          console.log(`Uploading ${file.name}...`);
          
          // Upload file
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          console.log(`File uploaded: ${file_url}`);

          // Enhanced AI extraction with detailed instructions - REMOVED, NOW IN BACKGROUND
          setUploadStatus(`Extracting data from ${file.name}... (${fileNum}/${totalFiles})`);
          setUploadProgress((fileNum - 0.5) / totalFiles * 100);
          console.log(`Extracting data from ${file.name}...`);
          const result_OLD = await base44.integrations.Core.InvokeLLM({
            prompt: `Extract detailed metadata from this research paper. Pay special attention to:

PUBLICATION YEAR: Look for publication date in header, footer, citations, or metadata. Extract the 4-digit year.

JOURNAL: Find the journal/publication name - often at the top of the first page or in citations.

DOI: Look for "DOI:", "doi.org/", or similar identifiers. Extract the full DOI (e.g., 10.1234/example).

STUDY LOCATION: Identify specific cities, regions, provinces, or areas in South Africa where research was conducted.

PROVINCE: Determine which South African province(s): Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, or Western Cape.

INSTITUTION: Find the affiliated university or research institution.

Extract all available information accurately. If a field is not found, leave it empty or null.`,
            file_urls: [file_url],
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Full paper title" },
                authors: { type: "array", items: { type: "string" }, description: "List of all authors" },
                abstract: { type: "string", description: "Complete abstract text" },
                publication_year: { type: "number", description: "4-digit publication year" },
                journal: { type: "string", description: "Journal or publication name" },
                doi: { type: "string", description: "Digital Object Identifier (DOI)" },
                pfas_compounds: { type: "array", items: { type: "string" }, description: "PFAS compounds studied (PFOA, PFOS, etc.)" },
                study_location: { type: "string", description: "Specific location in South Africa" },
                province: { type: "string", description: "South African province" },
                research_type: { type: "string", description: "Type of research" },
                sample_matrix: { type: "array", items: { type: "string" }, description: "Sample types (water, soil, etc.)" },
                key_findings: { type: "string", description: "Summary of main findings" },
                concentrations_reported: { type: "string", description: "Concentration ranges found" },
                keywords: { type: "array", items: { type: "string" }, description: "Research keywords" },
                institution: { type: "string", description: "Research institution or university" }
              }
            }
          });

          // Convert LLM response to extraction result format
          const extractionResult = {
            status: result ? "success" : "error",
            output: result,
            details: result ? null : "Failed to extract data"
          };
          const result2 = extractionResult;

          console.log(`Extraction result for ${file.name}:`, result2);

          if (result2.status === "success" && result2.output) {
            const extractedPaper = {
              ...result2.output,
              pdf_url: file_url,
              authors: result2.output.authors || [],
              pfas_compounds: result2.output.pfas_compounds || [],
              sample_matrix: result2.output.sample_matrix || [],
              keywords: result2.output.keywords || [],
              publication_year: result2.output.publication_year || new Date().getFullYear()
            };

            // AI validation: Check if research is South African
            setUploadStatus(`Validating research origin... (${fileNum}/${totalFiles})`);
            setUploadProgress((fileNum - 0.3) / totalFiles * 100);
            console.log(`Validating South African research: ${extractedPaper.title}`);
            try {
              const validationResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this research paper and determine if it is specifically about South African research, locations, or studies conducted in South Africa.

Research Paper:
Title: ${extractedPaper.title || 'N/A'}
Abstract: ${extractedPaper.abstract || 'N/A'}
Keywords: ${extractedPaper.keywords?.join(', ') || 'N/A'}
Study Location: ${extractedPaper.study_location || 'N/A'}
Province: ${extractedPaper.province || 'N/A'}
Institution: ${extractedPaper.institution || 'N/A'}
Authors: ${extractedPaper.authors?.join(', ') || 'N/A'}

Determine if this paper is about South African research. Look for:
1. Study conducted in South Africa
2. South African locations, provinces, cities
3. South African institutions or authors
4. Research specifically about South African water resources, environment, or populations

Return your analysis.`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    is_south_african: { type: "boolean" },
                    confidence: { type: "number" },
                    reason: { type: "string" }
                  }
                }
              });

              console.log(`Validation result for ${extractedPaper.title}:`, validationResult);

              if (!validationResult.is_south_african) {
                console.log(`Rejected non-South African paper: ${extractedPaper.title} - ${validationResult.reason}`);
                toast.error(`Rejected: "${extractedPaper.title}" - Not South African research. ${validationResult.reason}`);
                extractionErrors++;
                continue;
              }
            } catch (error) {
              console.error(`Error validating paper ${extractedPaper.title}:`, error);
              toast.warning(`Could not validate South African status for "${extractedPaper.title}". Proceeding with caution.`);
            }

            setUploadStatus(`Checking for duplicates... (${fileNum}/${totalFiles})`);
            setUploadProgress((fileNum - 0.1) / totalFiles * 100);
            console.log(`Checking for duplicates: ${extractedPaper.title}`);
            
            // Check for duplicates
            const duplicateCheck = await checkDuplicate(extractedPaper);
            if (duplicateCheck.isDuplicate) {
              console.log(`Duplicate found: ${duplicateCheck.title}`);
              toast.error(`Duplicate: "${duplicateCheck.title}"`);
              duplicatesFound++;
            } else {
              console.log(`New paper: ${extractedPaper.title}`);
              papers.push(extractedPaper);
              setUploadProgress((fileNum / totalFiles) * 100);
            }
          } else {
            console.error(`Extraction failed for ${file.name}:`, result2);
            toast.error(`Could not extract data from ${file.name}${result2.details ? ': ' + result2.details : ''}`);
            extractionErrors++;
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Error processing ${file.name}: ${error.message}`);
          extractionErrors++;
        }
      }

      console.log(`Processing complete. Papers: ${papers.length}, Duplicates: ${duplicatesFound}, Errors: ${extractionErrors}`);

      if (papers.length > 0) {
        setExtractedPapers(papers);
        toast.success(`Successfully extracted ${papers.length} paper(s)!`);
        if (duplicatesFound > 0) {
          toast.info(`${duplicatesFound} duplicate(s) skipped`);
        }

        // Automatically save the papers
        try {
          setUploadStatus(`Saving ${papers.length} papers to database...`);
          setUploadProgress(95);
          console.log('Saving papers to database...');
          await base44.entities.ResearchPaper.bulkCreate(papers);
          queryClient.invalidateQueries({ queryKey: ['papers'] });
          setUploadProgress(100);
          setUploadStatus("Complete!");
          toast.success(`${papers.length} paper(s) added to database!`);
          navigate(createPageUrl("Database"));
        } catch (error) {
          console.error('Failed to save papers:', error);
          toast.error(`Failed to save papers: ${error.message}`);
        }
      } else if (duplicatesFound > 0) {
        toast.error(`All ${duplicatesFound} document(s) were duplicates`);
      } else if (extractionErrors > 0) {
        toast.error(`Failed to extract data from ${extractionErrors} file(s)`);
      } else {
        toast.error("No papers could be extracted from the uploaded files");
      }
    } catch (error) {
      console.error('Error processing files OLD:', error);
      toast.error("Error processing files: " + error.message);
    } finally {
      setTimeout(() => {
        setIsExtracting(false);
        setUploadProgress(0);
        setUploadStatus("");
      }, 2000);
      // Reset file input
      e.target.value = '';
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
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Raw Data Files</h3>
                <p className="text-sm text-slate-600 text-center mb-4 max-w-md">
                  Upload PDF, Excel, CSV, images (JPEG, PNG), or other data files and we'll automatically extract the paper details for you
                </p>
                
                <div className="w-full max-w-md">
                  {isExtracting && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm text-slate-600 text-center">{uploadStatus}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center">{Math.round(uploadProgress)}%</p>
                    </div>
                  )}
                  
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Button
                      type="button"
                      className="bg-teal-600 hover:bg-teal-700 w-full"
                      disabled={isExtracting}
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Choose Files
                        </>
                      )}
                    </Button>
                  </label>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp"
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