import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const provinces = [
  { name: "Gauteng", x: 290, y: 270 },
  { name: "Western Cape", x: 180, y: 480 },
  { name: "KwaZulu-Natal", x: 380, y: 340 },
  { name: "Eastern Cape", x: 310, y: 420 },
  { name: "Free State", x: 280, y: 300 },
  { name: "Mpumalanga", x: 360, y: 230 },
  { name: "Limpopo", x: 340, y: 140 },
  { name: "North West", x: 250, y: 230 },
  { name: "Northern Cape", x: 210, y: 310 },
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
        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-teal-50/30 via-white to-slate-50 rounded-xl overflow-hidden">
          {/* High-quality South Africa SVG map */}
          <svg viewBox="0 0 500 580" className="w-full h-full">
            {/* South Africa provinces */}
            
            {/* Western Cape */}
            <path d="M 140,420 L 120,440 L 110,460 L 100,480 L 95,500 L 100,520 L 120,530 L 145,535 L 170,530 L 190,520 L 210,500 L 220,480 L 225,465 L 230,450 L 220,430 L 200,415 L 180,410 L 160,415 Z" 
              fill={provinceCounts["Western Cape"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Western Cape"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Eastern Cape */}
            <path d="M 230,450 L 245,440 L 265,435 L 285,435 L 305,440 L 325,450 L 345,465 L 360,480 L 370,495 L 375,510 L 370,525 L 355,535 L 335,540 L 315,538 L 295,532 L 275,522 L 255,510 L 240,495 L 230,480 Z" 
              fill={provinceCounts["Eastern Cape"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Eastern Cape"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Northern Cape */}
            <path d="M 140,420 L 160,400 L 180,385 L 200,375 L 220,370 L 240,365 L 260,360 L 270,340 L 275,320 L 275,300 L 270,280 L 260,260 L 245,245 L 225,235 L 205,230 L 185,235 L 165,245 L 145,260 L 130,280 L 120,300 L 115,320 L 115,340 L 120,360 L 125,380 L 130,400 Z" 
              fill={provinceCounts["Northern Cape"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Northern Cape"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Free State */}
            <path d="M 260,360 L 280,350 L 300,340 L 315,330 L 330,318 L 340,305 L 345,290 L 345,275 L 340,260 L 330,250 L 315,245 L 295,245 L 275,250 L 260,260 L 250,275 L 245,290 L 245,305 L 250,320 L 255,335 Z" 
              fill={provinceCounts["Free State"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Free State"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* KwaZulu-Natal */}
            <path d="M 345,465 L 365,455 L 385,440 L 400,420 L 410,400 L 415,380 L 415,360 L 410,345 L 400,330 L 385,320 L 365,315 L 350,320 L 340,335 L 335,350 L 335,365 L 340,380 L 345,395 L 350,410 L 355,425 L 360,440 Z" 
              fill={provinceCounts["KwaZulu-Natal"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["KwaZulu-Natal"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Gauteng */}
            <path d="M 270,260 L 290,255 L 310,255 L 325,260 L 335,270 L 340,285 L 335,300 L 325,310 L 310,315 L 290,315 L 275,310 L 265,300 L 260,285 Z" 
              fill={provinceCounts["Gauteng"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Gauteng"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Mpumalanga */}
            <path d="M 340,285 L 360,275 L 380,270 L 395,270 L 410,275 L 420,285 L 425,300 L 420,315 L 410,325 L 395,330 L 380,330 L 365,325 L 350,315 L 345,300 Z" 
              fill={provinceCounts["Mpumalanga"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Mpumalanga"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Limpopo */}
            <path d="M 270,180 L 290,170 L 310,165 L 330,165 L 350,170 L 370,180 L 390,195 L 405,210 L 415,230 L 420,250 L 420,270 L 410,255 L 395,245 L 375,240 L 355,240 L 335,245 L 315,255 L 295,260 L 280,255 L 265,245 L 255,230 L 250,215 L 250,195 Z" 
              fill={provinceCounts["Limpopo"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["Limpopo"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* North West */}
            <path d="M 205,230 L 225,220 L 245,215 L 260,215 L 270,225 L 275,240 L 275,255 L 270,270 L 260,280 L 245,285 L 230,285 L 215,280 L 200,270 L 190,255 L 185,240 Z" 
              fill={provinceCounts["North West"] > 0 ? "#14b8a6" : "#e2e8f0"} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
              className="transition-all duration-300 hover:brightness-110"
              opacity={provinceCounts["North West"] > 0 ? "0.8" : "0.4"}
            />
            
            {/* Data points with numbers */}
            {provinces.map((province) => {
              const count = provinceCounts[province.name] || 0;
              if (count === 0) return null;
              
              return (
                <g key={province.name}>
                  <circle 
                    cx={province.x} 
                    cy={province.y} 
                    r="20" 
                    fill="#0d9488"
                    className="drop-shadow-lg"
                  />
                  <text 
                    x={province.x} 
                    y={province.y + 6} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="16" 
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Tooltips */}
          {provinces.map((province) => {
            const count = provinceCounts[province.name] || 0;
            
            return (
              <div
                key={province.name}
                className="absolute group"
                style={{ 
                  left: `${(province.x / 500) * 100}%`, 
                  top: `${(province.y / 580) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-10 h-10 rounded-full cursor-pointer" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-xl">
                  <div className="font-semibold">{province.name}</div>
                  <div className="text-slate-300">{count} {count === 1 ? 'paper' : 'papers'}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-slate-300" />
            No studies
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-teal-500" />
            Has studies
          </span>
        </div>
      </CardContent>
    </Card>
  );
}