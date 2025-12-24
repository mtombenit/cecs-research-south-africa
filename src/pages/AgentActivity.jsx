import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, Loader2, CheckCircle, XCircle, Clock, AlertCircle,
  Upload, Search, RefreshCw, FileText, Download
} from "lucide-react";
import moment from "moment";
import ExportButton from "@/components/export/ExportButton";

export default function AgentActivityPage() {
  const [user, setUser] = useState(null);
  const [filterAction, setFilterAction] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['agentActivities'],
    queryFn: () => base44.entities.AgentActivity.list('-created_date', 500),
  });

  // Admin check
  const isAdmin = user?.role === 'admin';

  const filteredActivities = activities.filter(activity => {
    if (filterAction && activity.action !== filterAction) return false;
    if (filterStatus && activity.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        activity.details?.toLowerCase().includes(search) ||
        activity.action?.toLowerCase().includes(search) ||
        activity.user?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getActionIcon = (action) => {
    switch (action) {
      case 'upload': return Upload;
      case 'scan_start': return Search;
      case 'scan_end': return CheckCircle;
      case 'duplicate_skipped': return FileText;
      case 'error': return XCircle;
      case 'retry': return RefreshCw;
      default: return Activity;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-20 text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
              <p className="text-slate-600 mb-6">
                Agent Activity logs are restricted to authenticated administrators only.
              </p>
              <p className="text-sm text-slate-500">
                Contact your system administrator for access.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Agent Activity Log</h1>
              </div>
              <p className="text-slate-600">
                Monitor Database Manager agent actions and status
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="border-slate-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <ExportButton 
                data={filteredActivities} 
                filename="agent-activity-log"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search details, action, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Actions</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="scan_start">Scan Start</SelectItem>
                  <SelectItem value="scan_end">Scan End</SelectItem>
                  <SelectItem value="duplicate_skipped">Duplicate Skipped</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="retry">Retry</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterAction || filterStatus || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-slate-600"
                onClick={() => {
                  setFilterAction("");
                  setFilterStatus("");
                  setSearchTerm("");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
            <p className="text-slate-500">Loading activity log...</p>
          </div>
        ) : filteredActivities.length > 0 ? (
          <>
            <p className="text-sm text-slate-500 mb-6">
              Showing {filteredActivities.length} of {activities.length} entries
            </p>
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const ActionIcon = getActionIcon(activity.action);
                
                return (
                  <Card key={activity.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <ActionIcon className="w-5 h-5 text-slate-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 capitalize">
                                  {activity.action.replace(/_/g, ' ')}
                                </h3>
                                <Badge className={getStatusColor(activity.status)}>
                                  {activity.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  {moment(activity.timestamp || activity.created_date).format('MMM D, YYYY h:mm A')}
                                </span>
                                <span>User: {activity.user}</span>
                              </div>
                            </div>
                          </div>
                          
                          {activity.details && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <p className="text-sm text-slate-700 font-mono whitespace-pre-wrap">
                                {activity.details}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Activity Logs</h3>
              <p className="text-slate-500">
                {activities.length === 0 
                  ? "No agent activity has been logged yet."
                  : "Try adjusting your filters to see more results."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}