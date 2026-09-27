'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BedDouble,
  BusFront,
  Calendar,
  CarFront,
  CircleDollarSign,
  Compass,
  ExternalLink,
  MapPin,
  Plane,
  Soup,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import Footer from '@/components/Footer';

type SavedTrip = {
  id: string;
  title: string;
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
  breakdown: {
    transport: number;
    stay: number;
    food: number;
    activities: number;
    localTravel: number;
    nights: number;
    rooms: number;
  } | null;
};

const money = (amount: number) => `\u20B9${Math.round(amount).toLocaleString('en-IN')}`;

function transportShare(mode: string) {
  switch (mode.toUpperCase()) {
    case 'AIR': return 0.4;
    case 'TRAIN': return 0.24;
    case 'BUS': return 0.18;
    case 'CAR': return 0.29;
    case 'BIKE': return 0.18;
    default: return 0.25;
  }
}

function transportIcon(mode: string) {
  switch (mode.toUpperCase()) {
    case 'AIR': return Plane;
    case 'BUS': return BusFront;
    case 'CAR':
    case 'BIKE': return CarFront;
    default: return Ticket;
  }
}

function makeMyTripBooking(mode: string) {
  switch (mode.toUpperCase()) {
    case 'TRAIN':
    case 'RAIL':
      return { href: 'https://www.makemytrip.com/railways/', label: 'Book train ticket on MakeMyTrip' };
    case 'BUS':
      return { href: 'https://www.makemytrip.com/bus-tickets/', label: 'Book bus ticket on MakeMyTrip' };
    case 'AIR':
    case 'FLIGHT':
      return { href: 'https://www.makemytrip.com/flights/', label: 'Book flight on MakeMyTrip' };
    default:
      return null;
  }
}

export default function SavedTripDetailPage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const response = await fetch(`/api/trips?id=${encodeURIComponent(params.id)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load this saved trip.');
        setTrip(data.trip);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this saved trip.');
      }
    };
    loadTrip();
  }, [params.id]);

  const breakdown = useMemo(() => {
    if (!trip) return null;
    const total = trip.totalGroupCost;
    if (trip.breakdown) return { ...trip.breakdown, total };
    const transport = total * transportShare(trip.selectedTransportMode);
    const stay = total * (trip.durationDays >= 5 ? 0.34 : 0.31);
    const food = total * 0.18;
    const localTravel = total * 0.08;
    const activities = total - transport - stay - food - localTravel;
    const nights = Math.max(trip.durationDays - 1, 1);
    return { total, transport, stay, food, localTravel, activities, nights, rooms: Math.ceil(trip.travelers / 2) };
  }, [trip]);

  if (error) {
    return <main className="min-h-screen bg-[#0A0A0A] px-5 py-20 text-[#F5E6D3]"><div className="mx-auto max-w-xl rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6"><p className="font-bold">{error}</p><Link href="/trips" className="mt-4 inline-flex text-sm font-bold text-violet-300">Back to saved trips</Link></div></main>;
  }

  if (!trip || !breakdown) {
    return <main className="min-h-screen bg-[#0A0A0A] px-5 py-20 text-[#F5E6D3]"><div className="mx-auto h-72 max-w-5xl animate-pulse rounded-3xl bg-white/[0.04]" /></main>;
  }

  const TransportIcon = transportIcon(trip.selectedTransportMode);
  const booking = makeMyTripBooking(trip.selectedTransportMode);
  const items = [
    { label: `${trip.selectedTransportMode} travel`, note: `${trip.origin} to ${trip.destinationCity}`, amount: breakdown.transport, icon: TransportIcon, color: 'text-sky-300' },
    { label: 'Stay', note: `${breakdown.nights} night${breakdown.nights === 1 ? '' : 's'} for the group`, amount: breakdown.stay, icon: BedDouble, color: 'text-violet-300' },
    { label: 'Food', note: `${trip.travelers} travellers × ${trip.durationDays} days`, amount: breakdown.food, icon: Soup, color: 'text-amber-300' },
    { label: 'Local travel', note: 'Local rides, station/airport transfers', amount: breakdown.localTravel, icon: CarFront, color: 'text-teal-300' },
    { label: 'Activities & entry tickets', note: `Experiences at ${trip.destinationCity}`, amount: breakdown.activities, icon: Sparkles, color: 'text-rose-300' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5E6D3]">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/trips" className="inline-flex items-center gap-2 text-sm font-bold text-violet-300 hover:text-violet-200"><ArrowLeft className="h-4 w-4" /> Saved trips</Link>
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#F5E6D3]/10 bg-[#151515]">
          <div className="border-b border-white/[0.07] p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-300"><Compass className="h-4 w-4" /> Saved trip breakdown</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{trip.title}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-teal-300" /> {trip.origin} → {trip.destinationCity}, {trip.destinationCountry}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-violet-300" /> {trip.travelers} travellers</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-amber-300" /> {trip.durationDays} days</span>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Group trip total</p><p className="mt-2 text-3xl font-black text-teal-300">{money(breakdown.total)}</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Per person</p><p className="mt-2 text-3xl font-black text-white">{money(trip.estimatedCostPerPerson)}</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Travel choice</p><p className="mt-2 flex items-center gap-2 text-xl font-black text-white"><TransportIcon className="h-5 w-5 text-sky-300" /> {trip.selectedTransportMode}</p></div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-white">Where the money goes</h2>
          <p className="mt-1 text-sm text-slate-400">A complete allocation for this saved {trip.durationDays}-day group plan.</p>
          <div className="mt-4 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151515]">
            {items.map((item) => {
              const Icon = item.icon;
              return <div key={item.label} className="flex items-center gap-4 p-5"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] ${item.color}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="font-bold text-white">{item.label}</h3><p className="mt-0.5 text-xs text-slate-400">{item.note}</p></div><div className="text-right"><p className="font-mono text-lg font-black text-white">{money(item.amount)}</p><p className="text-[11px] text-slate-500">{money(item.amount / trip.travelers)} / person</p></div></div>;
            })}
            <div className="flex items-center justify-between bg-teal-400/[0.06] p-5"><span className="flex items-center gap-2 font-black text-white"><CircleDollarSign className="h-5 w-5 text-teal-300" /> Total group cost</span><span className="font-mono text-xl font-black text-teal-300">{money(breakdown.total)}</span></div>
          </div>
        </section>

        {booking && (
          <section className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/[0.07] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-300">Ready to book</p>
              <h2 className="mt-1 text-xl font-black text-white">{booking.label}</h2>
              <p className="mt-1 text-sm text-slate-300">Search {trip.origin} to {trip.destinationCity}, {trip.destinationCountry} and select your date and travellers on MakeMyTrip.</p>
            </div>
            <a href={booking.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-red-500 sm:mt-0">Open MakeMyTrip <ExternalLink className="h-4 w-4" /></a>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-500/[0.07] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300">Live stay availability</p>
            <h2 className="mt-1 text-xl font-black text-white">Find and book a hotel on MakeMyTrip</h2>
            <p className="mt-1 text-sm text-slate-300">Search {trip.destinationCity}, choose {breakdown.nights} night{breakdown.nights === 1 ? '' : 's'} and {breakdown.rooms} room{breakdown.rooms === 1 ? '' : 's'} for current price and availability.</p>
          </div>
          <a href="https://www.makemytrip.com/hotels/" target="_blank" rel="noreferrer" className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-violet-500 sm:mt-0">Check live hotels <ExternalLink className="h-4 w-4" /></a>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 text-sm text-amber-100"><p className="font-bold">About this breakdown</p><p className="mt-1 leading-relaxed text-amber-100/75">{trip.breakdown ? 'This is the exact cost breakdown you entered when saving the trip.' : 'This older saved trip has no itemized amounts, so the categories are a planning allocation based on total, mode, group size, and duration.'} For live driving distance, fuel, train, bus, and flight links, open Compare Routes and enter the same origin and destination.</p><Link href="/compare" className="mt-4 inline-flex items-center gap-2 font-bold text-amber-200 hover:text-white">Compare live transport <ArrowLeft className="h-4 w-4 rotate-180" /></Link></section>
      </main>
      <Footer />
    </div>
  );
}
