'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';

type MapPoint = { latitude: number; longitude: number; label: string };

function FitMap({ points, route }: { points: MapPoint[]; route?: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    const positions = route?.length
      ? route
      : points.map((point) => [point.latitude, point.longitude] as [number, number]);
    if (positions.length > 0) map.fitBounds(positions, { padding: [28, 28], maxZoom: 11 });
  }, [map, points, route]);
  return null;
}

export default function OpenStreetMapView({
  points,
  route,
  className = 'h-72',
}: {
  points: MapPoint[];
  route?: Array<[number, number]>;
  className?: string;
}) {
  const center: [number, number] = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [22.9734, 78.6569];

  return (
    <div className={`${className} overflow-hidden rounded-xl border border-[#F5E6D3]/[0.08]`}>
      <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />
        {route && <Polyline positions={route} pathOptions={{ color: '#dc2626', weight: 4 }} />}
        {points.map((point) => (
          <CircleMarker
            key={`${point.latitude}-${point.longitude}-${point.label}`}
            center={[point.latitude, point.longitude]}
            radius={7}
            pathOptions={{ color: '#f5e6d3', fillColor: '#dc2626', fillOpacity: 0.9 }}
          >
            <Popup>{point.label}</Popup>
          </CircleMarker>
        ))}
        <FitMap points={points} route={route} />
      </MapContainer>
    </div>
  );
}
