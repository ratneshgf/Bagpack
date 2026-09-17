import { NextResponse } from 'next/server';

// Temporary server-side in-memory store for user saved trips
interface SavedTrip {
  id: string;
  title: string;
  destinationSlug: string;
  destinationCity: string;
  destinationCountry: string;
  origin: string;
  travelers: number;
  durationDays: number;
  estimatedCostPerPerson: number;
  totalGroupCost: number;
  travelStyle: string;
  selectedTransportMode: string;
  createdAt: string;
  status: 'PLANNING' | 'BOOKED' | 'COMPLETED';
}

const mockTrips: SavedTrip[] = [
  {
    id: 'trip-1',
    title: 'Goa Friends Reunion',
    destinationSlug: 'goa-india',
    destinationCity: 'Goa',
    destinationCountry: 'India',
    origin: 'New Delhi (DEL)',
    travelers: 4,
    durationDays: 4,
    estimatedCostPerPerson: 18500,
    totalGroupCost: 74000,
    travelStyle: 'COMFORT',
    selectedTransportMode: 'AIR',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'PLANNING',
  },
  {
    id: 'trip-2',
    title: 'Rishikesh Rafting & Camping',
    destinationSlug: 'rishikesh-india',
    destinationCity: 'Rishikesh',
    destinationCountry: 'India',
    origin: 'New Delhi (DEL)',
    travelers: 6,
    durationDays: 3,
    estimatedCostPerPerson: 8200,
    totalGroupCost: 49200,
    travelStyle: 'BUDGET',
    selectedTransportMode: 'CAR',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'PLANNING',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    trips: mockTrips,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTrip: SavedTrip = {
      id: `trip-${Date.now()}`,
      title: body.title || `${body.destinationCity} Trip`,
      destinationSlug: body.destinationSlug,
      destinationCity: body.destinationCity,
      destinationCountry: body.destinationCountry || 'India',
      origin: body.origin || 'New Delhi (DEL)',
      travelers: body.travelers || 2,
      durationDays: body.durationDays || 4,
      estimatedCostPerPerson: body.estimatedCostPerPerson || 15000,
      totalGroupCost: body.totalGroupCost || 30000,
      travelStyle: body.travelStyle || 'COMFORT',
      selectedTransportMode: body.selectedTransportMode || 'AIR',
      createdAt: new Date().toISOString(),
      status: 'PLANNING',
    };

    mockTrips.unshift(newTrip);

    return NextResponse.json({
      success: true,
      trip: newTrip,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Trip id is required' }, { status: 400 });
  }

  const idx = mockTrips.findIndex((t) => t.id === id);
  if (idx !== -1) {
    mockTrips.splice(idx, 1);
  }

  return NextResponse.json({ success: true, removedId: id });
}
