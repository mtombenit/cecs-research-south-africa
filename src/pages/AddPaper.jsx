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
import { ArrowLeft, Plus, X, Save, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ResearchPaper.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      navigate(createPageUrl("Database"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
          <p className="text-slate-600 mt-1">Add a new PFAS research publication to the database</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
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
                  Save Paper
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}