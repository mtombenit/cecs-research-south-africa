import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <Card className={cn(
      "relative overflow-hidden p-4 sm:p-6 bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-teal-600 font-medium">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 sm:p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-teal-600" />
          </div>
        )}
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-teal-500/5 to-teal-500/10 rounded-full" />
    </Card>
  );
}