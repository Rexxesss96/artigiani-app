// Turns places into coordinates (latitude/longitude) using Nominatim,
// the free geocoding service of OpenStreetMap.
// Usage policy: identify the app with a User-Agent and send at most one
// request per second. If anything goes wrong we return null: callers
// must work without coordinates too.

type Coordinates = { latitude: number; longitude: number };
type Place = Coordinates & { name: string };

// ---------- One request per second ----------
// Every call waits for the previous one to finish + 1 s: a tiny queue
// made of a chain of Promises.
let queue: Promise<unknown> = Promise.resolve();

function nominatimSearch(params: Record<string, string>) {
  const run = async (): Promise<Place | null> => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "it");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "TrovArtigiano/0.1 (student project)" },
        // Don't keep the user waiting if the service is slow.
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return null;
      }
      const results: { lat: string; lon: string; name: string }[] =
        await response.json();
      if (results.length === 0) {
        return null;
      }
      return {
        latitude: Number(results[0].lat),
        longitude: Number(results[0].lon),
        name: results[0].name,
      };
    } catch {
      return null;
    }
  };

  const result = queue.then(run);
  queue = result.then(
    () => new Promise((resolve) => setTimeout(resolve, 1000)),
  );
  return result;
}

// ---------- A company's address ----------

type AddressParts = {
  address: string;
  postalCode: string;
  city: string;
  province: string;
};

// Returns strings because the companies table stores them as text.
export async function geocodeAddress(
  parts: AddressParts,
): Promise<{ latitude: string; longitude: string } | null> {
  const point = await nominatimSearch({
    q: `${parts.address}, ${parts.postalCode} ${parts.city} ${parts.province}, Italia`,
  });
  return point
    ? { latitude: String(point.latitude), longitude: String(point.longitude) }
    : null;
}

// ---------- A city typed in the search ----------
// Cached in memory: "Varese" is looked up once, then reused until the
// server restarts. featureType=settlement = only cities, towns, villages.
const cityCache = new Map<string, Coordinates | null>();

export async function geocodeCity(city: string): Promise<Coordinates | null> {
  const key = city.trim().toLowerCase();
  if (key.length < 3) {
    return null;
  }
  if (cityCache.has(key)) {
    return cityCache.get(key)!;
  }
  const place = await nominatimSearch({
    city: key,
    featureType: "settlement",
  });
  // Trust the answer only if it's the place that was typed: while the
  // user is still typing ("vare") Nominatim may return a different
  // town, and then a plain name match ("Varese") works better.
  // (Accents are ignored: "forli" matches "Forlì".)
  const plain = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const point =
    place && plain(place.name) === plain(key)
      ? { latitude: place.latitude, longitude: place.longitude }
      : null;
  cityCache.set(key, point);
  return point;
}
