// Turns a postal address into coordinates (latitude/longitude) using
// Nominatim, the free geocoding service of OpenStreetMap.
// Usage policy: identify the app with a User-Agent and keep traffic low
// (we only call it when a company registers or changes its address).
// If anything goes wrong we return null: the company is saved anyway,
// its profile simply won't show the map.

type AddressParts = {
  address: string;
  postalCode: string;
  city: string;
  province: string;
};

export async function geocodeAddress(
  parts: AddressParts,
): Promise<{ latitude: string; longitude: string } | null> {
  const query = `${parts.address}, ${parts.postalCode} ${parts.city} ${parts.province}, Italia`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "it");
  url.searchParams.set("q", query);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ArtigianiDirectory/0.1 (student project)" },
      // Don't keep the user waiting if the service is slow.
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return null;
    }

    const results: { lat: string; lon: string }[] = await response.json();
    if (results.length === 0) {
      return null;
    }
    return { latitude: results[0].lat, longitude: results[0].lon };
  } catch {
    return null;
  }
}
