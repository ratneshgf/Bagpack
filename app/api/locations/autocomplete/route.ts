import { NextResponse } from 'next/server';
import { DESTINATIONS } from '@/lib/destinations';

export const dynamic = 'force-dynamic';

const PHOTON_URL = process.env.PHOTON_API_URL || 'https://photon.komoot.io';

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
};

const DEFAULT_ORIGINS = [
  { id: 'delhi_in', label: 'New Delhi (DEL)', city: 'New Delhi', country: 'India', type: 'ORIGIN' },
  { id: 'mumbai_in', label: 'Mumbai (BOM)', city: 'Mumbai', country: 'India', type: 'ORIGIN' },
  { id: 'bengaluru_in', label: 'Bengaluru (BLR)', city: 'Bengaluru', country: 'India', type: 'ORIGIN' },
  { id: 'hyderabad_in', label: 'Hyderabad (HYD)', city: 'Hyderabad', country: 'India', type: 'ORIGIN' },
  { id: 'chennai_in', label: 'Chennai (MAA)', city: 'Chennai', country: 'India', type: 'ORIGIN' },
  { id: 'kolkata_in', label: 'Kolkata (CCU)', city: 'Kolkata', country: 'India', type: 'ORIGIN' },
  { id: 'pune_in', label: 'Pune (PNQ)', city: 'Pune', country: 'India', type: 'ORIGIN' },
  { id: 'ahmedabad_in', label: 'Ahmedabad (AMD)', city: 'Ahmedabad', country: 'India', type: 'ORIGIN' },
  { id: 'jaipur_in', label: 'Jaipur (JAI)', city: 'Jaipur', country: 'India', type: 'ORIGIN' },
  { id: 'kochi_in', label: 'Kochi (COK)', city: 'Kochi', country: 'India', type: 'ORIGIN' },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = (searchParams.get('q') || '').trim();
  const q = rawQuery.toLowerCase();
  const type = searchParams.get('type') || 'ANY'; // 'ORIGIN' | 'DESTINATION' | 'ANY'

  const results: Array<Record<string, unknown>> = [];

  if (type === 'ORIGIN' || type === 'ANY') {
    const matchedOrigins = DEFAULT_ORIGINS.filter(
      (o) =>
        !q ||
        o.city.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q)
    );
    results.push(...matchedOrigins);
  }

  if (type === 'DESTINATION' || type === 'ANY') {
    const matchedDestinations = DESTINATIONS.filter(
      (d) =>
        !q ||
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
    ).map((d) => ({
      id: d.id,
      slug: d.slug,
      label: `${d.city}, ${d.country}`,
      city: d.city,
      country: d.country,
      type: 'DESTINATION',
      tags: d.tags,
    }));

    results.push(...matchedDestinations);
  }

  // Photon searches the full OpenStreetMap index, so villages, islands,
  // neighbourhoods and other lesser-known places are not limited by our catalog.
  if (rawQuery.length >= 2) {
    try {
      const params = new URLSearchParams({ q: rawQuery, limit: '15', lang: 'en' });
      const response = await fetch(`${PHOTON_URL}/api/?${params}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(7_000),
      });
      if (response.ok) {
        const data = (await response.json()) as { features?: PhotonFeature[] };
        const liveResults = (data.features ?? []).flatMap((feature, index) => {
          const properties = feature.properties;
          const coordinates = feature.geometry?.coordinates;
          if (!properties?.name || !coordinates) return [];
          const area = properties.city || properties.district || properties.county;
          const parts = [properties.name, area, properties.state, properties.country]
            .filter((part, partIndex, all) => part && all.indexOf(part) === partIndex);
          return [{
            id: `osm-${properties.osm_type || 'place'}-${properties.osm_id || index}`,
            label: parts.join(', '),
            city: properties.name,
            country: properties.country || '',
            countryCode: properties.countrycode?.toUpperCase() || '',
            lat: coordinates[1],
            lng: coordinates[0],
            type: properties.type || 'PLACE',
          }];
        });
        results.push(...liveResults);
      }
    } catch {
      // Keep local catalog suggestions available if the public geocoder is down.
    }
  }

  const uniqueResults = results.filter((result, index, all) =>
    all.findIndex((candidate) => String(candidate.label).toLowerCase() === String(result.label).toLowerCase()) === index
  );

  return NextResponse.json({
    results: uniqueResults.slice(0, 15),
  });
}
