import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const tripInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  destinationSlug: z.string().trim().min(1).max(120),
  destinationCity: z.string().trim().min(1).max(120),
  destinationCountry: z.string().trim().min(1).max(120).default('India'),
  origin: z.string().trim().min(1).max(120).default('New Delhi (DEL)'),
  travelers: z.coerce.number().int().positive().default(2),
  durationDays: z.coerce.number().int().positive().default(4),
  estimatedCostPerPerson: z.coerce.number().nonnegative().default(15000),
  totalGroupCost: z.coerce.number().nonnegative().default(30000),
  travelStyle: z.string().trim().min(1).max(40).default('COMFORT'),
  selectedTransportMode: z.string().trim().min(1).max(40).default('AIR'),
  breakdown: z.object({
    transport: z.coerce.number().nonnegative(),
    stay: z.coerce.number().nonnegative(),
    food: z.coerce.number().nonnegative(),
    activities: z.coerce.number().nonnegative(),
    localTravel: z.coerce.number().nonnegative(),
    nights: z.coerce.number().int().nonnegative(),
    rooms: z.coerce.number().int().positive(),
  }).optional(),
});

type TripRow = {
  id: string;
  title: string;
  destination_slug: string;
  destination_city: string;
  destination_country: string;
  origin: string;
  travelers: number;
  duration_days: number;
  estimated_cost_per_person: number | string;
  total_group_cost: number | string;
  travel_style: string;
  selected_transport_mode: string;
  created_at: string;
  status: string;
  trip_breakdown?: {
    transport: number;
    stay: number;
    food: number;
    activities: number;
    localTravel: number;
    nights: number;
    rooms: number;
  } | null;
};

function toTrip(row: TripRow) {
  return {
    id: row.id,
    title: row.title,
    destinationSlug: row.destination_slug,
    destinationCity: row.destination_city,
    destinationCountry: row.destination_country,
    origin: row.origin,
    travelers: row.travelers,
    durationDays: row.duration_days,
    estimatedCostPerPerson: Number(row.estimated_cost_per_person),
    totalGroupCost: Number(row.total_group_cost),
    travelStyle: row.travel_style,
    selectedTransportMode: row.selected_transport_mode,
    createdAt: row.created_at,
    status: row.status,
    breakdown: row.trip_breakdown ?? null,
  };
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (id) {
    const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle();
    if (error) return NextResponse.json({ error: 'Unable to load this saved trip.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Saved trip not found.' }, { status: 404 });

    return NextResponse.json({ success: true, trip: toTrip(data as TripRow) });
  }

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Unable to load saved trips.' }, { status: 500 });

  return NextResponse.json({ success: true, trips: (data as TripRow[]).map(toTrip) });
}

export async function POST(request: Request) {
  const parsed = tripInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid trip details.' }, { status: 400 });
  }

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trip = parsed.data;
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      title: trip.title,
      destination_slug: trip.destinationSlug,
      destination_city: trip.destinationCity,
      destination_country: trip.destinationCountry,
      origin: trip.origin,
      travelers: trip.travelers,
      duration_days: trip.durationDays,
      estimated_cost_per_person: trip.estimatedCostPerPerson,
      total_group_cost: trip.totalGroupCost,
      travel_style: trip.travelStyle,
      selected_transport_mode: trip.selectedTransportMode,
      trip_breakdown: trip.breakdown ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Unable to save trip.' }, { status: 500 });

  return NextResponse.json({ success: true, trip: toTrip(data as TripRow) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Trip id is required.' }, { status: 400 });

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('trips').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Unable to delete trip.' }, { status: 500 });

  return NextResponse.json({ success: true, removedId: id });
}
