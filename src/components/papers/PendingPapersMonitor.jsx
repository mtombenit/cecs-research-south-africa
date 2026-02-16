import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PendingPapersMonitor() {
  const { data: pendingPapers = [] } = useQuery({
    queryKey: ['pending-papers'],
    queryFn: () => base44.entities.PendingPaper.list('-created_date', 50),
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const activePapers = pendingPapers.filter(p => 
    !['complete', 'duplicate', 'rejected', 'error'].includes(p.status)
  );

  const duplicatePapers = pendingPapers.filter(p => p.status === 'duplicate');
  const rejectedPapers = pendingPapers.filter(p => p.status === 'rejected');
  const errorPapers = pendingPapers.filter(p => p.status === 'error');

  if (activePapers.length === 0 && duplicatePapers.length === 0 && rejectedPapers.length === 0 && errorPapers.length === 0) return null;

  const statusConfig = {
    uploading: { icon: Loader2, color: 'text-blue-500', label: 'Uploading', spin: true },
    extracting: { icon: Loader2, color: 'text-purple-500', label: 'Extracting metadata', spin: true },
    validating: { icon: Loader2, color: 'text-orange-500', label: 'Validating', spin: true },
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Active Processing */}
      {activePapers.length > 0 && (
        <Card className="border-teal-200 bg-teal-50/50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              <h3 className="font-semibold text-slate-900">
                Processing {activePapers.length} paper{activePapers.length !== 1 ? 's' : ''}...
              </h3>
            </div>
            
            <div className="space-y-3">
              {activePapers.map(paper => {
                const config = statusConfig[paper.status] || { 
                  icon: FileText, 
                  color: 'text-slate-500', 
                  label: paper.status 
                };
                const Icon = config.icon;

                return (
                  <div key={paper.id} className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {paper.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {config.label}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">
                        {paper.progress}%
                      </span>
                    </div>
                    <Progress value={paper.progress} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Duplicates Detected */}
      {duplicatePapers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-slate-900">
                {duplicatePapers.length} Duplicate{duplicatePapers.length !== 1 ? 's' : ''} Detected
              </h3>
            </div>
            
            <div className="space-y-2">
              {duplicatePapers.map(paper => (
                <div key={paper.id} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 text-orange-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {paper.filename}
                      </p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        Duplicate of: {paper.duplicate_of || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Rejected Papers */}
      {rejectedPapers.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-slate-900">
                {rejectedPapers.length} Paper{rejectedPapers.length !== 1 ? 's' : ''} Rejected
              </h3>
            </div>
            
            <div className="space-y-2">
              {rejectedPapers.map(paper => (
                <div key={paper.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {paper.filename}
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {paper.error_message || 'Not South African research'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Errors */}
      {errorPapers.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-slate-900">
                {errorPapers.length} Error{errorPapers.length !== 1 ? 's' : ''}
              </h3>
            </div>
            
            <div className="space-y-2">
              {errorPapers.map(paper => (
                <div key={paper.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {paper.filename}
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {paper.error_message || 'Processing failed'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}