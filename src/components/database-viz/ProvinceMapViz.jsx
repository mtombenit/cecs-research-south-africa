import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Approximate coordinates for South African provinces (centroids)
const PROVINCE_COORDS = {
  "Gauteng": [-26.2708, 28.1123],
  "Western Cape": [-33.2277, 21.8569],
  "KwaZulu-Natal": [-28.5305, 30.8958],
  "Eastern Cape": [-32.2968, 26.4194],
  "Limpopo": [-23.4013, 29.4179],
  "Mpumalanga": [-25.5653, 30.5279],
  "North West": [-26.6638, 25.2837],
  "Free State": [-28.4541, 26.7968],
  "Northern Cape": [-29.0467, 21.8569]
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
  const provinceData = useMemo(() => {
    const counts = {};
    papers.forEach(paper => {
      if (paper.province && PROVINCE_COORDS[paper.province]) {
        counts[paper.province] = (counts[paper.province] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([province, count]) => ({
      province,
      count,
      coords: PROVINCE_COORDS[province]
    }));
  }, [papers]);

  const maxCount = Math.max(...provinceData.map(d => d.count), 1);

  if (provinceData.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Study Locations by Province</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-lg overflow-hidden">
          <MapContainer
            center={[-28.5, 24.5]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {provinceData.map(({ province, count, coords }) => (
              <CircleMarker
                key={province}
                center={coords}
                radius={10 + (count / maxCount) * 20}
                fillColor="#0d9488"
                fillOpacity={0.6}
                color="#fff"
                weight={2}
                eventHandlers={{
                  click: () => {
                    if (onProvinceClick) {
                      onProvinceClick(province);
                    }
                  }
                }}
                className="cursor-pointer hover:opacity-80"
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{province}</p>
                    <p className="text-slate-600">{count} publication{count !== 1 ? 's' : ''}</p>
                    <button
                      onClick={() => onProvinceClick && onProvinceClick(province)}
                      className="mt-2 text-teal-600 hover:text-teal-700 text-xs font-medium"
                    >
                      Filter by {province} →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}