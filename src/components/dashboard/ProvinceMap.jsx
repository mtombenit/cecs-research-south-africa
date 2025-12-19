import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const provinces = [
  { name: "Gauteng", x: 60, y: 45 },
  { name: "Western Cape", x: 25, y: 85 },
  { name: "KwaZulu-Natal", x: 75, y: 60 },
  { name: "Eastern Cape", x: 55, y: 80 },
  { name: "Free State", x: 50, y: 55 },
  { name: "Mpumalanga", x: 72, y: 40 },
  { name: "Limpopo", x: 65, y: 25 },
  { name: "North West", x: 42, y: 40 },
  { name: "Northern Cape", x: 30, y: 55 },
];

export default function ProvinceMap({ papers }) {
  const provinceCounts = {};
  papers?.forEach(paper => {
    if (paper.province) {
      provinceCounts[paper.province] = (provinceCounts[paper.province] || 0) + 1;
    }
  });

  const maxCount = Math.max(...Object.values(provinceCounts), 1);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Research by Province</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
          {/* Simple SA outline representation */}
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
            <path
              d="M20,30 Q30,15 50,20 Q70,15 80,30 Q90,45 85,60 Q80,80 60,90 Q40,95 25,85 Q15,70 20,50 Z"
              fill="none"
              stroke="#0d9488"
              strokeWidth="0.5"
            />
          </svg>
          
          {provinces.map((province) => {
            const count = provinceCounts[province.name] || 0;
            const size = count > 0 ? Math.max(20, (count / maxCount) * 40) : 16;
            
            return (
              <div
                key={province.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: `${province.x}%`, top: `${province.y}%` }}
              >
                <div 
                  className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                    count > 0 
                      ? 'bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/30' 
                      : 'bg-slate-300'
                  }`}
                  style={{ width: size, height: size }}
                >
                  {count > 0 && (
                    <span className="text-white text-xs font-bold">{count}</span>
                  )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {province.name}: {count} {count === 1 ? 'paper' : 'papers'}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            No studies
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            Has studies
          </span>
        </div>
      </CardContent>
    </Card>
  );
}