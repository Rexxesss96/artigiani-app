// Small OpenStreetMap map with a marker on the company.
// It's an <iframe> of the official OSM embed page: no extra library
// and no API key needed. bbox = the visible area (lon/lat edges).

export function CompanyMap({
  latitude,
  longitude,
  title,
  openLabel,
}: {
  latitude: number;
  longitude: number;
  title: string;
  openLabel: string;
}) {
  const delta = 0.008; // about 1 km around the marker
  const bbox = [
    longitude - delta,
    latitude - delta / 1.6,
    longitude + delta,
    latitude + delta / 1.6,
  ].join(",");

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const fullUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div>
      <iframe
        title={title}
        src={embedUrl}
        loading="lazy"
        className="h-56 w-full rounded-xl border border-border"
      />
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="link mt-2 inline-block text-sm"
      >
        {openLabel}
      </a>
    </div>
  );
}
