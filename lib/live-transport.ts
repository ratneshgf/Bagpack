import type { TransportOption, TransportMode } from './types';

type GoogleRoute = {
  distanceMeters?: number;
  duration?: string;
  travelAdvisory?: { tollInfo?: { estimatedPrice?: Array<{ currencyCode?: string; units?: string; nanos?: number }> } };
  polyline?: { encodedPolyline?: string };
};

type FuelPriceResponse = {
  price?: number;
  priceInrPerLiter?: number;
  updatedAt?: string;
  provider?: string;
  data?: FuelPriceResponse;
};

export type ProviderStatus = {
  road: 'LIVE' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
  fuel: 'LIVE' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
  train: 'LIVE' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
  bus: 'LIVE' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
};

export type LiveTransportResult = { options: TransportOption[]; providers: ProviderStatus };

const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const ORS_API_URL = 'https://api.heigit.org/openrouteservice/v2';

type OrsFeature = { geometry?: { coordinates?: [number, number] } };
type OrsRoute = { routes?: Array<{ summary?: { distance?: number; duration?: number }; geometry?: { coordinates?: Array<[number, number]> } }> };
type OsrmRoute = { routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: Array<[number, number]> } }> };

async function getOsrmRoadOption(input: {
  origin: string; destination: string; travelers: number; mode: 'CAR' | 'BIKE'; mileageKmPerLiter: number; fuelPricePerLiter: number;
}): Promise<TransportOption> {
  const photonUrl = process.env.PHOTON_API_URL || 'https://photon.komoot.io';
  const lookup = async (place: string) => {
    const response = await fetch(`${photonUrl}/api/?${new URLSearchParams({ q: place, limit: '1' })}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    const body = (await response.json()) as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> };
    const point = body.features?.[0]?.geometry?.coordinates;
    if (!point) throw new Error('Location not found');
    return point;
  };
  const [origin, destination] = await Promise.all([lookup(input.origin), lookup(input.destination)]);
  const baseUrl = (process.env.OSRM_API_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/route/v1/driving/${origin.join(',')};${destination.join(',')}?overview=full&geometries=geojson`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Community route ${response.status}`);
  const body = (await response.json()) as OsrmRoute;
  const route = body.routes?.[0];
  const distanceKm = (route?.distance ?? 0) / 1000;
  const durationMinutes = Math.round((route?.duration ?? 0) / 60);
  if (!distanceKm || !durationMinutes) throw new Error('Road route unavailable');
  const roundTripDistanceKm = Math.round(distanceKm * 20) / 10;
  const fuelCost = Math.round((roundTripDistanceKm / input.mileageKmPerLiter) * input.fuelPricePerLiter);
  const routeCoordinates = route?.geometry?.coordinates?.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
  return { id: `osrm-${input.mode.toLowerCase()}`, title: input.mode === 'CAR' ? 'Self-drive car' : 'Motorcycle route', operator: 'OpenStreetMap community routing', mode: input.mode, totalCost: fuelCost, costPerPerson: Math.round(fuelCost / input.travelers), durationMinutes, details: `Community road route ${distanceKm.toFixed(1)} km one-way. Fuel cost uses your ₹${input.fuelPricePerLiter}/L entry; tolls are excluded.`, dataQuality: 'LIVE', currency: 'INR', pricingBasis: 'GROUP', roadBreakdown: { distanceKm: Math.round(distanceKm * 10) / 10, roundTripDistanceKm, fuelCost, tollEstimate: 0, vehicleType: input.mode === 'CAR' ? 'PERSONAL_CAR' : 'MOTORCYCLE', fuelPricePerLiter: input.fuelPricePerLiter, mileageKmPerLiter: input.mileageKmPerLiter, tollSource: 'UNAVAILABLE', dataSource: 'OPENSTREETMAP', routeCoordinates } };
}

async function geocodeWithOrs(query: string, apiKey: string): Promise<[number, number]> {
  const params = new URLSearchParams({ text: query, size: '1' });
  const response = await fetch(`https://api.heigit.org/pelias/v1/search?${params}`, {
    headers: { Authorization: apiKey }, cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Location lookup ${response.status}`);
  const body = (await response.json()) as { features?: OrsFeature[] };
  const coordinates = body.features?.[0]?.geometry?.coordinates;
  if (!coordinates) throw new Error('Location not found');
  return coordinates;
}

async function getOrsRoadOption(input: {
  origin: string; destination: string; travelers: number; mode: 'CAR' | 'BIKE'; mileageKmPerLiter: number; fuelPricePerLiter: number; apiKey: string;
}): Promise<TransportOption> {
  const [origin, destination] = await Promise.all([geocodeWithOrs(input.origin, input.apiKey), geocodeWithOrs(input.destination, input.apiKey)]);
  const profile = input.mode === 'CAR' ? 'driving-car' : 'cycling-regular';
  const response = await fetch(`${ORS_API_URL}/directions/${profile}/json`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15_000),
    headers: { Authorization: input.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates: [origin, destination] }),
  });
  if (!response.ok) throw new Error(`Road route ${response.status}`);
  const body = (await response.json()) as OrsRoute;
  const route = body.routes?.[0];
  const distanceKm = (route?.summary?.distance ?? 0) / 1000;
  const durationMinutes = Math.round((route?.summary?.duration ?? 0) / 60);
  if (!distanceKm || !durationMinutes) throw new Error('Road route unavailable');
  const roundTripDistanceKm = Math.round(distanceKm * 20) / 10;
  const fuelCost = Math.round((roundTripDistanceKm / input.mileageKmPerLiter) * input.fuelPricePerLiter);
  const routeCoordinates = route?.geometry?.coordinates?.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
  return {
    id: `ors-${input.mode.toLowerCase()}`, title: input.mode === 'CAR' ? 'Self-drive car' : 'Motorcycle route', operator: 'openrouteservice', mode: input.mode,
    totalCost: fuelCost, costPerPerson: Math.round(fuelCost / input.travelers), durationMinutes, details: `Live road distance ${distanceKm.toFixed(1)} km one-way. Fuel cost uses your ₹${input.fuelPricePerLiter}/L entry; tolls are excluded.`,
    dataQuality: 'LIVE', currency: 'INR', pricingBasis: 'GROUP',
    roadBreakdown: { distanceKm: Math.round(distanceKm * 10) / 10, roundTripDistanceKm, fuelCost, tollEstimate: 0, vehicleType: input.mode === 'CAR' ? 'PERSONAL_CAR' : 'MOTORCYCLE', fuelPricePerLiter: input.fuelPricePerLiter, mileageKmPerLiter: input.mileageKmPerLiter, tollSource: 'UNAVAILABLE', dataSource: 'OPENSTREETMAP', routeCoordinates },
  };
}

function durationMinutes(value?: string) {
  const seconds = Number.parseInt(value?.replace('s', '') ?? '', 10);
  return Number.isFinite(seconds) ? Math.max(1, Math.round(seconds / 60)) : 0;
}

function moneyInInr(
  prices?: NonNullable<NonNullable<GoogleRoute['travelAdvisory']>['tollInfo']>['estimatedPrice'],
) {
  const price = prices?.find((item) => item.currencyCode === 'INR');
  if (!price) return null;
  return Number(price.units ?? 0) + Number(price.nanos ?? 0) / 1_000_000_000;
}

function decodePolyline(encoded?: string): Array<[number, number]> | undefined {
  if (!encoded) return undefined;
  const points: Array<[number, number]> = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const decodeValue = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    latitude += decodeValue();
    longitude += decodeValue();
    points.push([latitude / 1e5, longitude / 1e5]);
  }
  return points;
}

async function getLiveFuelPrice() {
  const url = process.env.FUEL_PRICE_API_URL;
  if (!url) return { status: 'NOT_CONFIGURED' as const };
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Fuel price provider ${response.status}`);
    const body = (await response.json()) as FuelPriceResponse;
    const value = body.priceInrPerLiter ?? body.price ?? body.data?.priceInrPerLiter ?? body.data?.price;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Invalid fuel price response');
    return {
      status: 'LIVE' as const,
      price: value,
      updatedAt: body.updatedAt ?? body.data?.updatedAt,
      provider: body.provider ?? body.data?.provider ?? 'fuel-price provider',
    };
  } catch {
    return { status: 'UNAVAILABLE' as const };
  }
}

async function getGoogleRoadOption(input: {
  origin: string;
  destination: string;
  travelers: number;
  mode: 'CAR' | 'BIKE';
  mileageKmPerLiter: number;
  fuel: Awaited<ReturnType<typeof getLiveFuelPrice>>;
}): Promise<TransportOption | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || input.fuel.status !== 'LIVE') return null;
  const response = await fetch(GOOGLE_ROUTES_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { address: input.origin },
      destination: { address: input.destination },
      travelMode: input.mode === 'CAR' ? 'DRIVE' : 'TWO_WHEELER',
      routingPreference: input.mode === 'CAR' ? 'TRAFFIC_AWARE' : undefined,
      departureTime: new Date().toISOString(),
      extraComputations: ['TOLLS'],
      routeModifiers: { vehicleInfo: { emissionType: 'GASOLINE' } },
      polylineQuality: 'HIGH_QUALITY',
    }),
  });
  if (!response.ok) throw new Error(`Google Routes ${response.status}`);
  const body = (await response.json()) as { routes?: GoogleRoute[] };
  const route = body.routes?.[0];
  if (!route?.distanceMeters) throw new Error('Google Routes returned no route');

  const distanceKm = Math.round(route.distanceMeters / 100) / 10;
  const roundTripDistanceKm = distanceKm * 2;
  const fuelCost = Math.round((roundTripDistanceKm / input.mileageKmPerLiter) * input.fuel.price);
  const tollEstimate = Math.round(moneyInInr(route.travelAdvisory?.tollInfo?.estimatedPrice) ?? 0) * 2;
  const totalCost = fuelCost + tollEstimate;
  const title = input.mode === 'CAR' ? 'Self-drive car' : 'Self-ride motorcycle';

  return {
    id: `google-${input.mode.toLowerCase()}`,
    title,
    operator: 'Google Routes + live fuel feed',
    mode: input.mode,
    totalCost,
    costPerPerson: Math.round(totalCost / input.travelers),
    durationMinutes: durationMinutes(route.duration),
    details: `Live route ${distanceKm.toLocaleString('en-IN')} km one-way; fuel price ₹${input.fuel.price}/L from ${input.fuel.provider}. Tolls are Google Routes estimates.`,
    dataQuality: 'LIVE',
    currency: 'INR',
    pricingBasis: 'GROUP',
    roadBreakdown: {
      distanceKm,
      roundTripDistanceKm,
      fuelCost,
      tollEstimate,
      vehicleType: input.mode === 'CAR' ? 'PERSONAL_CAR' : 'MOTORCYCLE',
      fuelPricePerLiter: input.fuel.price,
      mileageKmPerLiter: input.mileageKmPerLiter,
      tollSource: 'GOOGLE_ROUTES',
      dataSource: 'GOOGLE_ROUTES',
      routeCoordinates: decodePolyline(route.polyline?.encodedPolyline),
    },
  };
}

function isLiveOption(value: unknown): value is TransportOption {
  if (!value || typeof value !== 'object') return false;
  const option = value as Partial<TransportOption>;
  return ['RAIL', 'BUS'].includes(option.mode as TransportMode)
    && typeof option.totalCost === 'number' && option.totalCost >= 0
    && typeof option.durationMinutes === 'number' && option.durationMinutes >= 0;
}

async function getPartnerQuotes(kind: 'train' | 'bus', payload: Record<string, unknown>) {
  const endpoint = process.env[kind === 'train' ? 'TRAIN_QUOTE_API_URL' : 'BUS_QUOTE_API_URL'];
  const apiKey = process.env[kind === 'train' ? 'TRAIN_QUOTE_API_KEY' : 'BUS_QUOTE_API_KEY'];
  if (!endpoint || !apiKey) return { status: 'NOT_CONFIGURED' as const, options: [] };
  try {
    const response = await fetch(endpoint, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(12_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`${kind} provider ${response.status}`);
    const body = (await response.json()) as { options?: unknown[] };
    const options = (body.options ?? []).filter(isLiveOption).map((option) => ({
      ...option,
      id: option.id ?? `${kind}-${crypto.randomUUID()}`,
      costPerPerson: option.costPerPerson ?? option.totalCost,
      dataQuality: 'LIVE' as const,
      pricingBasis: option.pricingBasis ?? 'PER_PERSON' as const,
    }));
    return { status: 'LIVE' as const, options };
  } catch {
    return { status: 'UNAVAILABLE' as const, options: [] };
  }
}

export async function getLiveTransportQuotes(input: {
  origin: string; destination: string; travelers: number; departureDate?: string; carMileageKmPerLiter: number; bikeMileageKmPerLiter: number; fuelPricePerLiter: number;
}): Promise<LiveTransportResult> {
  const fuel = await getLiveFuelPrice();
  const orsApiKey = process.env.OPENROUTESERVICE_API_KEY;
  const hasGoogle = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  const providers: ProviderStatus = {
    road: orsApiKey || hasGoogle ? 'LIVE' : 'NOT_CONFIGURED',
    fuel: orsApiKey ? 'LIVE' : fuel.status,
    train: 'NOT_CONFIGURED',
    bus: 'NOT_CONFIGURED',
  };
  const payload = { origin: input.origin, destination: input.destination, travelers: input.travelers, departureDate: input.departureDate };
  const [car, bike, train, bus] = await Promise.all([
    orsApiKey ? getOrsRoadOption({ ...input, mode: 'CAR', mileageKmPerLiter: input.carMileageKmPerLiter, apiKey: orsApiKey }).catch(() => getOsrmRoadOption({ ...input, mode: 'CAR', mileageKmPerLiter: input.carMileageKmPerLiter })) : getOsrmRoadOption({ ...input, mode: 'CAR', mileageKmPerLiter: input.carMileageKmPerLiter }),
    orsApiKey ? getOrsRoadOption({ ...input, mode: 'BIKE', mileageKmPerLiter: input.bikeMileageKmPerLiter, apiKey: orsApiKey }).catch(() => getOsrmRoadOption({ ...input, mode: 'BIKE', mileageKmPerLiter: input.bikeMileageKmPerLiter })) : getOsrmRoadOption({ ...input, mode: 'BIKE', mileageKmPerLiter: input.bikeMileageKmPerLiter }),
    getPartnerQuotes('train', payload), getPartnerQuotes('bus', payload),
  ]);
  providers.train = train.status;
  providers.bus = bus.status;
  if ((orsApiKey || hasGoogle) && (!car || !bike)) providers.road = 'UNAVAILABLE';
  if (!orsApiKey && fuel.status !== 'LIVE') providers.road = 'NOT_CONFIGURED';
  const options = [car, bike, ...train.options, ...bus.options].filter((option): option is TransportOption => Boolean(option));
  return { options: options.sort((a, b) => a.totalCost - b.totalCost), providers };
}
