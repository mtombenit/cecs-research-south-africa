import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { toast } from "sonner";

export default function UploadCECData() {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setResult(null);

      // Upload the file
      toast.info('Uploading file...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setUploading(false);
      setProcessing(true);
      toast.info('Processing spreadsheet data...');

      // Process the spreadsheet
      const response = await base44.functions.invoke('processSpreadsheet', {
        file_url,
        filename: file.name
      });

      setProcessing(false);

      if (response.data.success) {
        setResult(response.data);
        toast.success(`Successfully imported ${response.data.records_inserted} records!`);
      } else {
        setError(response.data.error || 'Processing failed');
        toast.error('Failed to process spreadsheet');
      }

    } catch (err) {
      setUploading(false);
      setProcessing(false);
      setError(err.message);
      toast.error('Upload failed: ' + err.message);
    }
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
              Supported formats: Excel (.xlsx, .xls) or CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-teal-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls,.csv"
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
                    ? 'Uploading your file to the server...'
                    : processing 
                    ? 'Extracting and cleaning data...'
                    : 'or drag and drop your spreadsheet here'}
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Success Result */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="w-5 h-5" />
                Import Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {result.records_inserted}
                  </div>
                  <div className="text-sm text-green-700">Records Imported</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {result.records_processed}
                  </div>
                  <div className="text-sm text-green-700">Records Processed</div>
                </div>
              </div>
              
              {result.sample_record && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-xs font-semibold text-green-900 mb-2">Sample Record:</div>
                  <div className="text-sm text-green-800">
                    <strong>{result.sample_record.contaminant_name}</strong>
                    {result.sample_record.cec_category && (
                      <span className="text-green-600"> • {result.sample_record.cec_category}</span>
                    )}
                    {result.sample_record.province && (
                      <span className="text-green-600"> • {result.sample_record.province}</span>
                    )}
                  </div>
                </div>
              )}
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