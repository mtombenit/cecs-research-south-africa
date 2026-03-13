import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { toast } from "sonner";

export default function UploadCECData() {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [totalFiles, setTotalFiles] = useState(0);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const invalidFiles = files.filter(file => 
      !validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)
    );
    
    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) skipped - only Excel and CSV files are supported`);
      return;
    }

    try {
      setError(null);
      setResults([]);
      setTotalFiles(files.length);
      const processResults = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(`${file.name} (${i + 1}/${files.length})`);
        
        // Upload the file
        setUploading(true);
        toast.info(`Uploading ${file.name}...`);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        setUploading(false);
        setProcessing(true);
        toast.info(`Processing ${file.name}...`);

        // Process the spreadsheet
        try {
          const response = await base44.functions.invoke('processSpreadsheet', {
            file_url,
            filename: file.name
          });

          setProcessing(false);

          if (response.data.success) {
            processResults.push({ 
              filename: file.name, 
              success: true, 
              ...response.data 
            });
            toast.success(`${file.name}: ${response.data.records_inserted} records imported`);
          } else {
            processResults.push({ 
              filename: file.name, 
              success: false, 
              error: response.data.error || 'Processing failed' 
            });
            toast.error(`${file.name}: Processing failed`);
          }
        } catch (err) {
          processResults.push({ 
            filename: file.name, 
            success: false, 
            error: err.message 
          });
          toast.error(`${file.name}: ${err.message}`);
        }
      }

      setUploading(false);
      setProcessing(false);
      setCurrentFile(null);
      setResults(processResults);

      const successCount = processResults.filter(r => r.success).length;
      const totalRecords = processResults.reduce((sum, r) => sum + (r.records_inserted || 0), 0);
      
      if (successCount === files.length) {
        toast.success(`All ${files.length} files processed successfully! Total: ${totalRecords} records`);
      } else if (successCount > 0) {
        toast.warning(`${successCount}/${files.length} files processed successfully`);
      } else {
        toast.error('All files failed to process');
      }

    } catch (err) {
      setUploading(false);
      setProcessing(false);
      setCurrentFile(null);
      setError(err.message);
      toast.error('Upload failed: ' + err.message);
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload CEC Data</h1>
          <p className="text-slate-600">
            Upload Excel or CSV files containing CEC monitoring data. Data will be automatically cleaned, 
            standardized, and imported into the database.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              Upload Spreadsheet
            </CardTitle>
            <CardDescription>
              Supported formats: Excel (.xlsx, .xls) or CSV files • Select multiple files at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-teal-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                multiple
                onChange={handleFileUpload}
                disabled={uploading || processing}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${(uploading || processing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading || processing ? (
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-teal-600 animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto mb-4 text-teal-600" />
                )}
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Click to upload'}
                </p>
                <p className="text-sm text-slate-500">
                  {uploading 
                    ? currentFile ? `Uploading ${currentFile}...` : 'Uploading files...'
                    : processing 
                    ? currentFile ? `Processing ${currentFile}...` : 'Extracting and cleaning data...'
                    : 'Select multiple files or drag and drop'}
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Database className="w-5 h-5 text-teal-600" />
                Import Results ({results.length} files)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {results.filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-900">
                    {results.filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <div className="text-2xl font-bold text-teal-900">
                    {results.reduce((sum, r) => sum + (r.records_inserted || 0), 0)}
                  </div>
                  <div className="text-sm text-teal-700">Total Records</div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            {result.filename}
                          </div>
                          {result.success ? (
                            <div className="text-xs text-green-700 mt-1">
                              {result.records_inserted} records imported from {result.records_processed} processed
                            </div>
                          ) : (
                            <div className="text-xs text-red-700 mt-1">
                              {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Result */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-5 h-5" />
                Processing Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                1
              </div>
              <div>
                <strong className="text-slate-900">Upload your spreadsheet</strong>
                <p className="text-slate-600 mt-1">
                  Select an Excel or CSV file containing CEC monitoring data
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                2
              </div>
              <div>
                <strong className="text-slate-900">Automatic data extraction</strong>
                <p className="text-slate-600 mt-1">
                  AI extracts all rows and columns from your spreadsheet
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                3
              </div>
              <div>
                <strong className="text-slate-900">Data cleaning & standardization</strong>
                <p className="text-slate-600 mt-1">
                  Parses categories, extracts numeric values, infers provinces and water body types
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                4
              </div>
              <div>
                <strong className="text-slate-900">Database insertion</strong>
                <p className="text-slate-600 mt-1">
                  Cleaned records are inserted into the CECRecord entity
                </p>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-4">
              <p className="text-teal-900 text-xs font-semibold mb-1">Expected Columns:</p>
              <p className="text-teal-800 text-xs">
                Contaminant Name, Commonly Known As, Formula, Sampling Site, Concentration Detected, 
                Unit Of Measure, Data Reference, Point Latitude, Point Longitude, and more...
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}