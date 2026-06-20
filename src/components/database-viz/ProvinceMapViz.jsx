import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const PROVINCE_COORDS = {
  "Gauteng": [-26.2708, 28.1123],
  "Western Cape": [-33.2277, 21.8569],
  "KwaZulu-Natal": [-28.5305, 30.8958],
  "Eastern Cape": [-32.2968, 26.4194],
  "Limpopo": [-23.4013, 29.4179],
  "Mpumalanga": [-25.5653, 30.5279],
  "North West": [-26.6638, 25.2837],
  "Free State": [-28.4541, 26.7968],
  "Northern Cape": [-29.0467, 21.8569],
  "Nairobi County": [-1.286, 36.817],
  "Central Region": [-13.5, 34.0],
  "Northern Region": [-11.0, 34.0],
  "Southern Region": [-15.5, 35.0],
  "Eastern Region": [-14.0, 35.5],
  "Western Region": [-14.5, 33.5],
  "National": [-28.5, 25.0],
};

const COUNTRY_COORDS = {
  "South Africa": [-28.5, 25.0],
  "Angola": [-11.2, 17.9],
  "Botswana": [-22.3, 24.7],
  "Burundi": [-3.4, 30.0],
  "Cameroon": [3.8, 11.5],
  "Chad": [15.5, 18.7],
  "Comoros": [-11.6, 43.3],
  "Democratic Republic of Congo": [-4.0, 21.8],
  "Egypt": [26.8, 30.8],
  "Ethiopia": [9.1, 40.5],
  "Eswatini": [-26.5, 31.5],
  "Ghana": [7.9, -1.0],
  "Kenya": [0.0, 37.9],
  "Lesotho": [-29.6, 28.2],
  "Libya": [26.3, 17.2],
  "Madagascar": [-18.8, 46.9],
  "Malawi": [-13.3, 34.3],
  "Mauritius": [-20.3, 57.6],
  "Morocco": [31.8, -7.1],
  "Mozambique": [-18.7, 35.5],
  "Namibia": [-22.0, 17.1],
  "Nigeria": [9.1, 8.7],
  "Rwanda": [-1.9, 29.9],
  "Seychelles": [-4.7, 55.5],
  "Sudan": [15.6, 32.5],
  "Tanzania": [-6.4, 34.9],
  "Tunisia": [33.9, 9.6],
  "Uganda": [1.4, 32.3],
  "Zambia": [-13.1, 27.8],
  "Zimbabwe": [-20.0, 30.0],
  "Global (Review)": [2.0, 20.0],
  "Multiple Countries": [5.0, 15.0],
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 6);
    }
  }, [center, map]);
  return null;
}

export default function ProvinceMapViz({ papers, onProvinceClick }) {
  const { markers, hasData } = useMemo(() => {
    const provinceCounts = {};
    const countryCounts = {};

    papers.forEach(paper => {
      // Use province for SA papers (more precise)
      if (paper.country === "South Africa" && paper.province && PROVINCE_COORDS[paper.province]) {
        provinceCounts[paper.province] = (provinceCounts[paper.province] || 0) + 1;
      } else if (paper.country && COUNTRY_COORDS[paper.country]) {
        countryCounts[paper.country] = (countryCounts[paper.country] || 0) + 1;
      } else if (paper.province && PROVINCE_COORDS[paper.province]) {
        provinceCounts[paper.province] = (provinceCounts[paper.province] || 0) + 1;
      }
    });

    const allMarkers = [
      ...Object.entries(provinceCounts).map(([label, count]) => ({
        key: `province-${label}`, label, count,
        coords: PROVINCE_COORDS[label], type: "province"
      })),
      ...Object.entries(countryCounts).map(([label, count]) => ({
        key: `country-${label}`, label, count,
        coords: COUNTRY_COORDS[label], type: "country"
      })),
    ];

    return { markers: allMarkers, hasData: allMarkers.length > 0 };
  }, [papers]);

  const maxCount = Math.max(...markers.map(d => d.count), 1);

  // Center on Africa broadly if non-SA markers exist, else SA
  const hasNonSA = markers.some(m => m.type === "country");
  const mapCenter = hasNonSA ? [-5, 25] : [-28.5, 24.5];
  const mapZoom = hasNonSA ? 3 : 5;

  if (!hasData) return null;

  return (
    <Card className="border-0 shadow-sm relative z-0">
      <CardHeader>
        <CardTitle className="text-lg">Study Locations by Province</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-lg overflow-hidden relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map(({ key, label, count, coords, type }) => (
              <CircleMarker
                key={key}
                center={coords}
                radius={10 + (count / maxCount) * 20}
                fillColor={type === "province" ? "#0d9488" : "#2563eb"}
                fillOpacity={0.65}
                color="#fff"
                weight={2}
                eventHandlers={{
                  click: () => onProvinceClick && onProvinceClick(label)
                }}
                className="cursor-pointer hover:opacity-80"
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{label}</p>
                    <p className="text-slate-600">{count} publication{count !== 1 ? 's' : ''}</p>
                    {onProvinceClick && (
                      <button
                        onClick={() => onProvinceClick(label)}
                        className="mt-2 text-teal-600 hover:text-teal-700 text-xs font-medium"
                      >
                        Filter by {label} →
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-600 inline-block" /> SA Province</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Other African Country</span>
        </div>
      </CardContent>
    </Card>
  );
}