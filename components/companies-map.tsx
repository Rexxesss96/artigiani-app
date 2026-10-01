"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";

// Interactive map (Leaflet + OpenStreetMap tiles) with one marker per
// company. Leaflet needs the browser's `window`, so this component is
// loaded only in the browser: see companies-map-loader.tsx.

export type MapCompany = {
  id: number;
  businessName: string;
  city: string;
  latitude: number;
  longitude: number;
};

// A marker drawn with HTML/CSS in the app's accent color, instead of
// Leaflet's default PNG icons (which bundlers often fail to find).
const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--accent);border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});

export default function CompaniesMap({
  companies,
  profileLabel,
}: {
  companies: MapCompany[];
  profileLabel: string;
}) {
  // Center of Italy when there's nothing to show; otherwise the map
  // zooms to fit every marker (`bounds`).
  const bounds =
    companies.length > 0
      ? L.latLngBounds(companies.map((c) => [c.latitude, c.longitude]))
      : undefined;

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [40, 40], maxZoom: 14 }}
      center={bounds ? undefined : [42.5, 12.5]}
      zoom={bounds ? undefined : 5}
      scrollWheelZoom={false}
      className="h-[480px] w-full rounded-2xl border border-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {companies.map((company) => (
        <Marker
          key={company.id}
          position={[company.latitude, company.longitude]}
          icon={markerIcon}
        >
          <Popup>
            <strong>{company.businessName}</strong>
            <br />
            {company.city}
            <br />
            <Link href={`/companies/${company.id}`}>{profileLabel}</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
