'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDownRight, ArrowRight, Check, Compass, MapPin, Search, Sparkles, Users, Wallet } from 'lucide-react';
import Footer from '@/components/Footer';
import LocationAutocomplete from '@/components/LocationAutocomplete';

const BUDGET_OPTIONS = [
  { label: '₹15,000 / person', value: 15000 },
  { label: '₹25,000 / person', value: 25000 },
  { label: '₹40,000 / person', value: 40000 },
  { label: '₹60,000 / person', value: 60000 },
  { label: '₹85,000+ / person', value: 85000 },
];

const POPULAR_DESTINATIONS = [
  { name: 'Goa', tag: 'Beach & sunsets', cost: '₹18,500', duration: '4 days', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', slug: 'goa-india', color: 'bg-[#ff6b5f]' },
  { name: 'Manali', tag: 'Himalayan snow', cost: '₹14,200', duration: '4 days', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800', slug: 'manali-india', color: 'bg-[#91b7ff]' },
  { name: 'Bangkok', tag: 'Visa-free escape', cost: '₹34,000', duration: '5 days', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800', slug: 'bangkok-thailand', color: 'bg-[#f7c948]' },
  { name: 'Rishikesh', tag: 'Rafting & nature', cost: '₹8,500', duration: '3 days', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', slug: 'rishikesh-india', color: 'bg-[#8fe3c2]' },
];

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState('New Delhi (DEL)');
  const [place, setPlace] = useState('');
  const [travelers, setTravelers] = useState(4);
  const [budgetPerPerson, setBudgetPerPerson] = useState(25000);

  const handleSearch = (interest?: string) => {
    const params = new URLSearchParams({ origin, travelers: travelers.toString(), budget: (budgetPerPerson * travelers).toString(), budgetScope: 'GROUP', duration: '4', tripScope: 'BOTH', style: budgetPerPerson > 40000 ? 'COMFORT' : 'BUDGET', interests: interest || 'BEACH,ADVENTURE', month: '2026-11' });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="neo-page w-full overflow-hidden bg-[#f7f1e8] text-[#161616]">
      <section className="relative isolate min-h-[760px] border-b-[3px] border-[#161616] bg-[#193968]">
        <div className="absolute inset-0 -z-10 bg-[url('/images/seven-wonders-hero.png')] bg-cover bg-center opacity-80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#142c4d]/95 via-[#142c4d]/70 to-[#142c4d]/25" />
        <div className="absolute inset-0 -z-10 bg-[#f04b3e]/10 mix-blend-multiply" />
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-12 lg:pt-28">
          <div className="max-w-3xl text-white">
            <div className="neo-chip mb-7 inline-flex items-center gap-2 bg-[#f7c948] text-[#161616]"><Sparkles className="h-4 w-4" /> Budget-first travel intelligence</div>
            <h1 className="neo-title max-w-3xl text-[clamp(3.8rem,8vw,7.6rem)] leading-[.86] tracking-[-.08em]">Your budget.<br />Your <span className="text-[#f7c948] [text-shadow:4px_4px_0_#161616]">world.</span></h1>
            <p className="mt-8 max-w-xl text-lg font-semibold leading-relaxed text-[#fff9ee] sm:text-xl">Tell us what you can spend. We turn real travel costs into a trip you can actually book.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4 text-sm font-black uppercase tracking-[.16em]"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-[#161616] bg-[#8fe3c2]" /> Flights</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-[#161616] bg-[#f7c948]" /> Stays</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-[#161616] bg-[#ff6b5f]" /> Food + local</span></div>
          </div>
          <div className="neo-card bg-[#f7f1e8] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-5 border-b-[3px] border-[#161616] pb-5"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#f04b3e]">Start here</p><h2 className="neo-heading mt-1 text-3xl">Build your trip</h2></div><div className="neo-sticker rotate-6 bg-[#f7c948]">01</div></div>
            <div className="mt-5 space-y-4">
              <label className="neo-field block"><span className="neo-label"><MapPin className="h-4 w-4" /> Leaving from</span><LocationAutocomplete value={origin} onChange={setOrigin} type="ORIGIN" placeholder="Type a city or airport" className="w-full bg-transparent text-base font-black text-[#161616] outline-none placeholder:text-[#777]" /></label>
              <label className="neo-field block"><span className="neo-label"><Compass className="h-4 w-4" /> Search any hidden place</span><LocationAutocomplete value={place} onChange={setPlace} type="DESTINATION" placeholder="Try Tirthan Valley, Ziro, Gokarna..." className="w-full bg-transparent text-base font-black text-[#161616] outline-none placeholder:text-[#777]" /></label>
              {place.trim() && <button type="button" onClick={() => router.push(`/place?name=${encodeURIComponent(place.trim())}`)} className="neo-button w-full bg-[#8fe3c2] py-3 text-sm">Plan this place <ArrowRight className="h-4 w-4" /></button>}
              <div className="grid gap-4 sm:grid-cols-2"><label className="neo-field block"><span className="neo-label"><Users className="h-4 w-4" /> Travellers</span><select value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} className="w-full bg-transparent text-base font-black outline-none"><option value={1}>Solo (1)</option><option value={2}>Couple (2)</option><option value={4}>4 friends</option><option value={6}>6 friends</option><option value={8}>8+ group</option></select></label><label className="neo-field block"><span className="neo-label"><Wallet className="h-4 w-4" /> Per person</span><select value={budgetPerPerson} onChange={(e) => setBudgetPerPerson(Number(e.target.value))} className="w-full bg-transparent text-base font-black outline-none">{BUDGET_OPTIONS.map((budget) => <option key={budget.value} value={budget.value}>{budget.label}</option>)}</select></label></div>
              <button type="button" onClick={() => handleSearch()} className="neo-button neo-button-red mt-2 w-full py-4 text-base"><Search className="h-5 w-5" /> Show me the possibilities <ArrowRight className="h-5 w-5" /></button>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-black uppercase tracking-wider"><span className="mr-1 text-[#555]">I&apos;m into:</span>{['BEACH', 'MOUNTAINS', 'NIGHTLIFE', 'RELAXATION'].map((interest) => <button key={interest} type="button" onClick={() => handleSearch(interest)} className="neo-pill hover:bg-[#f7c948]">{interest.toLowerCase()}</button>)}</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 hidden -translate-x-1/4 translate-y-1/2 rotate-[-12deg] lg:block"><div className="neo-sticker-lg bg-[#f04b3e] text-white">GO<br />SOMEWHERE<br />GOOD <ArrowDownRight className="mt-1 h-7 w-7" /></div></div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><p className="neo-kicker">How it works</p><h2 className="neo-heading mt-3 text-5xl sm:text-6xl">Big trips.<br /><span className="text-[#f04b3e]">No guesswork.</span></h2></div><div className="grid gap-4 sm:grid-cols-3">{[['01', 'Set the limit', 'Start with a real number, not a vague dream.'], ['02', 'Pick the vibe', 'Beach, mountains, food, or a little bit of everything.'], ['03', 'Get the route', 'See flights, stays, food, and local transport together.']].map(([number, title, copy]) => <article key={number} className="neo-card bg-white p-5"><div className="neo-number bg-[#91b7ff]">{number}</div><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mt-2 text-sm font-semibold leading-relaxed text-[#555]">{copy}</p></article>)}</div></div>
        <div className="mt-24 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="neo-kicker">Don&apos;t overthink it</p><h2 className="neo-heading mt-2 text-5xl">Popular right now</h2></div><Link href="/search" className="neo-link">See every destination <ArrowRight className="h-5 w-5" /></Link></div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{POPULAR_DESTINATIONS.map((destination) => <Link key={destination.name} href={`/destination/${destination.slug}`} className="neo-card group overflow-hidden bg-white"><div className="relative h-52 overflow-hidden border-b-[3px] border-[#161616]"><img src={destination.img} alt={destination.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /><span className={`absolute left-3 top-3 neo-tag ${destination.color}`}>{destination.tag}</span></div><div className="p-4"><div className="flex items-end justify-between gap-2"><h3 className="text-2xl font-black">{destination.name}</h3><span className="text-right text-xs font-black uppercase leading-tight text-[#f04b3e]">from<br /><span className="text-sm text-[#161616]">{destination.cost}</span></span></div><div className="mt-4 flex items-center justify-between border-t-2 border-[#161616] pt-3 text-xs font-black uppercase tracking-wider"><span>{destination.duration}</span><span className="flex items-center gap-1">Explore <ArrowRight className="h-3.5 w-3.5" /></span></div></div></Link>)}</div>
      </section>
      <section className="border-y-[3px] border-[#161616] bg-[#f7c948] px-5 py-12 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div className="neo-sticker bg-[#8fe3c2]"><Check className="h-6 w-6" /></div><p className="max-w-xl text-xl font-black leading-tight sm:text-2xl">Every route is calculated with the costs that usually surprise you.</p></div><Link href="/search" className="neo-button bg-[#161616] text-white">Plan my trip <Compass className="h-5 w-5" /></Link></div></section>
      <Footer />
    </main>
  );
}
