import type { LivePlaceResearch, TransportOption } from './types';

const NOMINATIM_URL = process.env.NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org';
const PHOTON_URL = process.env.PHOTON_API_URL || 'https://photon.komoot.io';
const OSRM_URL = process.env.OSRM_API_URL || 'https://router.project-osrm.org';
const OSM_USER_AGENT = process.env.OSM_USER_AGENT || 'BagPack/0.1 (local-development)';
const FUEL_PRICE_INR_PER_LITER = 105;
const CAR_MILEAGE_KM_PER_LITER = 15;

type NominatimResult = {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  category?: string;
  importance?: number;
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry?: { type: 'LineString'; coordinates: Array<[number, number]> };
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
  };
};

let nominatimQueue: Promise<unknown> = Promise.resolve();

function queuedNominatimFetch<T>(url: string): Promise<T> {
  const task = nominatimQueue.then(async () => {
    const response = await fetch(url, {
      headers: { 'User-Agent': OSM_USER_AGENT, 'Accept-Language': 'en' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    return response.json() as Promise<T>;
  });
  const release = () => new Promise((resolve) => setTimeout(resolve, 1100));
  nominatimQueue = task.then(release, release);
  return task;
}

async function geocode(place: string): Promise<NominatimResult> {
  const params = new URLSearchParams({ q: place, format: 'jsonv2', limit: '1', addressdetails: '1' });
  try {
    const results = await queuedNominatimFetch<NominatimResult[]>(`${NOMINATIM_URL}/search?${params}`);
    if (results[0]) return results[0];
  } catch {
    // Some cloud/dev networks are rejected by the public Nominatim instance.
  }

  const photonParams = new URLSearchParams({ q: place, limit: '1', lang: 'en' });
  const response = await fetch(`${PHOTON_URL}/api/?${photonParams}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Photon geocoder ${response.status}`);
  const data = (await response.json()) as { features?: PhotonFeature[] };
  const feature = data.features?.[0];
  if (!feature) throw new Error(`OpenStreetMap could not locate "${place}"`);
  const [lon, lat] = feature.geometry.coordinates;
  return {
    place_id: feature.properties.osm_id ?? 0,
    osm_id: feature.properties.osm_id,
    osm_type: feature.properties.osm_type?.toLowerCase(),
    display_name: [feature.properties.name, feature.properties.city, feature.properties.state, feature.properties.country].filter(Boolean).join(', '),
    name: feature.properties.name,
    lat: String(lat),
    lon: String(lon),
    type: feature.properties.type,
  };
}

export async function getOpenStreetMapRoadTransport(
  origin: string,
  destination: string,
  travelers: number,
): Promise<TransportOption[]> {
  const from = await geocode(origin);
  const to = await geocode(destination);
  const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'false' });
  const response = await fetch(`${OSRM_URL}/route/v1/driving/${coordinates}?${params}`, {
    headers: { 'User-Agent': OSM_USER_AGENT },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`OSRM ${response.status}`);

  const data = (await response.json()) as { code?: string; routes?: OsrmRoute[] };
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) throw new Error('No drivable OpenStreetMap route was found');

  const distanceKm = Math.round(route.distance / 100) / 10;
  const roundTripDistanceKm = Math.round(distanceKm * 2 * 10) / 10;
  const fuelCost = Math.round((roundTripDistanceKm / CAR_MILEAGE_KM_PER_LITER) * FUEL_PRICE_INR_PER_LITER);
  const routeCoordinates = route.geometry?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

  return [{
    id: 'osm-car',
    title: 'Road Trip (OpenStreetMap route)',
    operator: 'Self-drive / rental car',
    mode: 'CAR',
    totalCost: fuelCost,
    costPerPerson: Math.round(fuelCost / travelers),
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    details: `${distanceKm.toLocaleString('en-IN')} km one-way · ${Math.round(route.duration / 360) / 10}h estimated drive time · round-trip fuel`,
    dataQuality: 'LIVE',
    currency: 'INR',
    pricingBasis: 'GROUP',
    roadBreakdown: {
      distanceKm,
      roundTripDistanceKm,
      fuelCost,
      tollEstimate: 0,
      vehicleType: travelers > 4 ? '7_SEATER_SUV' : 'SEDAN_HATCHBACK',
      fuelPricePerLiter: FUEL_PRICE_INR_PER_LITER,
      mileageKmPerLiter: CAR_MILEAGE_KM_PER_LITER,
      tollSource: 'UNAVAILABLE',
      dataSource: 'OPENSTREETMAP',
      routeCoordinates,
    },
  }];
}

export async function searchOpenStreetMapIndia(query: string): Promise<LivePlaceResearch[]> {
  const params = new URLSearchParams({
    q: `${query}, India`,
    format: 'jsonv2',
    limit: '12',
    addressdetails: '1',
    namedetails: '1',
    extratags: '1',
    countrycodes: 'in',
  });
  let results: NominatimResult[] = [];
  try {
    results = await queuedNominatimFetch<NominatimResult[]>(`${NOMINATIM_URL}/search?${params}`);
  } catch {
    const photonParams = new URLSearchParams({ q: `${query}, India`, limit: '12', lang: 'en' });
    const response = await fetch(`${PHOTON_URL}/api/?${photonParams}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`OpenStreetMap search failed (${response.status})`);
    const data = (await response.json()) as { features?: PhotonFeature[] };
    results = (data.features ?? []).map((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      return {
        place_id: feature.properties.osm_id ?? Math.round(lat * 1_000_000 + lon * 10_000),
        osm_id: feature.properties.osm_id,
        osm_type: feature.properties.osm_type?.toLowerCase(),
        display_name: [feature.properties.name, feature.properties.city, feature.properties.state, feature.properties.country].filter(Boolean).join(', '),
        name: feature.properties.name,
        lat: String(lat),
        lon: String(lon),
        type: feature.properties.type,
      };
    });
  }
  return results.map((place) => {
    const osmPath = place.osm_type && place.osm_id
      ? `${place.osm_type === 'node' || place.osm_type === 'n' ? 'node' : place.osm_type === 'way' || place.osm_type === 'w' ? 'way' : 'relation'}/${place.osm_id}`
      : `search?query=${encodeURIComponent(place.display_name)}`;
    return {
      id: `osm-${place.place_id}`,
      name: place.name || place.display_name.split(',')[0],
      address: place.display_name,
      category: place.type || place.category,
      mapUri: `https://www.openstreetmap.org/${osmPath}`,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      reviewHighlights: [],
    };
  });
}
