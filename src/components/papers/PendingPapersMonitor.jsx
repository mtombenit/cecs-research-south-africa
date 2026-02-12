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

  if (activePapers.length === 0) return null;

  const statusConfig = {
    uploading: { icon: Loader2, color: 'text-blue-500', label: 'Uploading', spin: true },
    extracting: { icon: Loader2, color: 'text-purple-500', label: 'Extracting metadata', spin: true },
    validating: { icon: Loader2, color: 'text-orange-500', label: 'Validating', spin: true },
    checking_duplicates: { icon: Loader2, color: 'text-teal-500', label: 'Checking duplicates', spin: true },
  };

  return (
    <Card className="border-teal-200 bg-teal-50/50 mb-6">
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
  );
}