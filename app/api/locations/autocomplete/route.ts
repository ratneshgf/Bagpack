import { NextResponse } from 'next/server';
import { DESTINATIONS } from '@/lib/destinations';

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
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const type = searchParams.get('type') || 'ANY'; // 'ORIGIN' | 'DESTINATION' | 'ANY'

  let results: any[] = [];

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

  return NextResponse.json({
    results: results.slice(0, 15),
  });
}
