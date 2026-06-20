import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Country coordinates (lat, lng)
const countryCoords = {
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
  "Global (Review)": [0.0, 20.0],
  "Multiple Countries": [5.0, 20.0],
};

// Province coordinates within South Africa
const provinceCoords = {
  "Gauteng": [-26.3, 28.0],
  "Western Cape": [-33.2, 19.0],
  "KwaZulu-Natal": [-29.0, 30.5],
  "Eastern Cape": [-32.3, 26.4],
  "Free State": [-28.5, 26.2],
  "Mpumalanga": [-25.5, 30.5],
  "Limpopo": [-23.4, 29.5],
  "North West": [-26.7, 25.3],
  "Northern Cape": [-29.0, 21.9],
  "Nairobi County": [-1.3, 36.8],
  "Central Region": [-13.5, 34.0],
  "Northern Region": [-11.0, 34.0],
  "Southern Region": [-15.5, 35.0],
  "Eastern Region": [-14.0, 35.5],
  "Western Region": [-14.5, 33.5],
  "National": [-28.5, 25.0],
};

export default function ProvinceMap({ papers }) {
  // Count by country
  const countryCounts = {};
  const provinceCounts = {};

  papers?.forEach(paper => {
    if (paper.country) {
      countryCounts[paper.country] = (countryCounts[paper.country] || 0) + 1;
    }
    if (paper.province) {
      provinceCounts[paper.province] = (provinceCounts[paper.province] || 0) + 1;
    }
  });

  const maxCount = Math.max(...Object.values(countryCounts), ...Object.values(provinceCounts), 1);

  const getRadius = (count) => Math.max(8, Math.sqrt(count / maxCount) * 40);

  // Build markers: provinces for SA, countries for others
  const markers = [];

  // Country-level markers (excluding South Africa which uses provinces)
  Object.entries(countryCounts).forEach(([country, count]) => {
    if (country === "South Africa") return; // handled by provinces
    const coords = countryCoords[country];
    if (coords) {
      markers.push({ key: `country-${country}`, lat: coords[0], lng: coords[1], label: country, count });
    }
  });

  // Province-level markers for South Africa
  Object.entries(provinceCounts).forEach(([province, count]) => {
    const coords = provinceCoords[province];
    if (coords) {
      markers.push({ key: `province-${province}`, lat: coords[0], lng: coords[1], label: province, count });
    }
  });

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Study Locations</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="w-full h-[420px] rounded-b-xl overflow-hidden">
          <MapContainer
            center={[-5, 25]}
            zoom={3}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map(marker => (
              <CircleMarker
                key={marker.key}
                center={[marker.lat, marker.lng]}
                radius={getRadius(marker.count)}
                pathOptions={{
                  fillColor: "#14b8a6",
                  fillOpacity: 0.75,
                  color: "#0d9488",
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="text-sm font-semibold">{marker.label}</div>
                  <div className="text-xs text-slate-600">{marker.count} {marker.count === 1 ? "paper" : "papers"}</div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}