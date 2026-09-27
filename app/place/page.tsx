'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Bookmark, MapPin, Users } from 'lucide-react';

function PlacePlanner() {
  const searchParams = useSearchParams();
  const place = searchParams.get('name')?.trim() || 'Your selected place';
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(3);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [city, country = 'India'] = place.split(',').map((part) => part.trim());
  const perPerson = 3500 * days;
  const slug = `custom-${place.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)}`;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${city} getaway`,
          destinationSlug: slug,
          destinationCity: city,
          destinationCountry: country,
          travelers,
          durationDays: days,
          estimatedCostPerPerson: perPerson,
          totalGroupCost: perPerson * travelers,
          travelStyle: 'BUDGET',
          selectedTransportMode: 'FLEXIBLE',
        }),
      });
      if (!response.ok) throw new Error('Unable to save this place.');
      setSaved(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save this place.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#f7f1e8] px-5 py-14 text-[#161616] sm:px-8">
      <section className="neo-card mx-auto max-w-2xl bg-white p-6 sm:p-9">
        <p className="neo-kicker">Off-the-beaten-path planner</p>
        <h1 className="neo-heading mt-2 text-4xl sm:text-5xl">{place}</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#555]">This place came from the live OpenStreetMap location index. Set the group details, save it, then refine transport and stays as you plan.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="neo-field"><span className="neo-label"><Users className="h-4 w-4" /> Travellers</span><select value={travelers} onChange={(event) => setTravelers(Number(event.target.value))} className="w-full bg-transparent font-black outline-none">{[1,2,3,4,6,8].map((value) => <option key={value} value={value}>{value} people</option>)}</select></label>
          <label className="neo-field"><span className="neo-label"><MapPin className="h-4 w-4" /> Days</span><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-full bg-transparent font-black outline-none">{[2,3,4,5,7].map((value) => <option key={value} value={value}>{value} days</option>)}</select></label>
        </div>
        <div className="mt-5 border-2 border-[#161616] bg-[#f7c948] p-4 font-black">Starter estimate: ₹{perPerson.toLocaleString('en-IN')} per person</div>
        {message && <p role="alert" className="mt-4 font-bold text-[#b42318]">{message}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={save} disabled={saving || saved} className="neo-button neo-button-red disabled:opacity-60"><Bookmark className="h-5 w-5" />{saved ? 'Saved to Trips' : saving ? 'Saving...' : 'Save this place'}</button>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`} target="_blank" rel="noreferrer" className="neo-button bg-[#161616] text-white">View on map <ArrowRight className="h-5 w-5" /></a>
          <Link href="/search" className="neo-link">Back to ideas</Link>
        </div>
      </section>
    </main>
  );
}

export default function PlacePage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f7f1e8]" />}><PlacePlanner /></Suspense>;
}
