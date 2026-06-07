"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Zone → coordinate lookup (Băneasa area)
const ZONE_COORDS: [string, [number, number]][] = [
  ["baneasa",        [44.4937, 26.0878]],
  ["pipera",         [44.5094, 26.1106]],
  ["aviatorilor",    [44.4710, 26.0724]],
  ["floreasca",      [44.4773, 26.0887]],
  ["herastrau",      [44.4730, 26.0812]],
  ["piata presei",   [44.4702, 26.0798]],
  ["dobroesti",      [44.4850, 26.1500]],
  ["bucuresti nord", [44.5010, 26.0900]],
  ["nord",           [44.5010, 26.0900]],
  ["otopeni",        [44.5500, 26.0750]],
];

function normRo(s: string) {
  return s.toLowerCase()
    .replace(/[ăâ]/g, "a").replace(/î/g, "i")
    .replace(/[șş]/g, "s").replace(/[țţ]/g, "t");
}

function getZoneCoords(zone?: string | null): [number, number] {
  if (!zone) return [44.4937, 26.0878];
  const z = normRo(zone);
  for (const [key, coords] of ZONE_COORDS) {
    if (z.includes(normRo(key))) return coords;
  }
  return [44.4937, 26.0878];
}

interface ProviderMapProps {
  lat?: number | null;
  lng?: number | null;
  zone?: string | null;
  name: string;
  address?: string | null;
}

export function ProviderMap({ lat, lng, zone, name, address }: ProviderMapProps) {
  const coords: [number, number] = lat && lng ? [lat, lng] : getZoneCoords(zone);

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--border)", marginBottom: 18 }}>
      <div style={{ padding: "8px 14px", background: "var(--background)", borderBottom: "1px solid var(--border)", fontSize: 11.5, fontWeight: 800, color: "var(--vb-text-m)", letterSpacing: 0.3, textTransform: "uppercase" }}>
        📍 Zona de activitate
      </div>
      <MapContainer
        center={coords}
        zoom={15}
        style={{ height: 190, width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords} icon={icon}>
          <Popup closeButton={false}>
            <strong>{name}</strong>
            {address && <><br />{address}</>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
