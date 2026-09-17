'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Users,
  Wallet,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Search,
} from 'lucide-react';
import Footer from '@/components/Footer';

const POPULAR_ORIGINS = [
  'New Delhi (DEL)',
  'Mumbai (BOM)',
  'Bengaluru (BLR)',
  'Hyderabad (HYD)',
  'Chennai (MAA)',
  'Kolkata (CCU)',
  'Pune (PNQ)',
];

const BUDGET_OPTIONS = [
  { label: '₹15,000 / person', value: 15000 },
  { label: '₹25,000 / person', value: 25000 },
  { label: '₹40,000 / person', value: 40000 },
  { label: '₹60,000 / person', value: 60000 },
  { label: '₹85,000+ / person', value: 85000 },
];

const POPULAR_DESTINATIONS = [
  {
    name: 'Goa',
    tag: 'Beach & Sunsets',
    cost: '₹18,500',
    duration: '4 Days',
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
    slug: 'goa-india',
  },
  {
    name: 'Manali',
    tag: 'Himalayan Snow',
    cost: '₹14,200',
    duration: '4 Days',
    img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
    slug: 'manali-india',
  },
  {
    name: 'Bangkok',
    tag: 'Visa-Free Escape',
    cost: '₹34,000',
    duration: '5 Days',
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    slug: 'bangkok-thailand',
  },
  {
    name: 'Rishikesh',
    tag: 'Rafting & Nature',
    cost: '₹8,500',
    duration: '3 Days',
    img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
    slug: 'rishikesh-india',
  },
];

export default function HomePage() {
  const router = useRouter();

  const [origin, setOrigin] = useState('New Delhi (DEL)');
  const [travelers, setTravelers] = useState(4);
  const [budgetPerPerson, setBudgetPerPerson] = useState(25000);

  const handleSearch = (interest?: string) => {
    const totalGroupBudget = budgetPerPerson * travelers;
    const params = new URLSearchParams({
      origin,
      travelers: travelers.toString(),
      budget: totalGroupBudget.toString(),
      budgetScope: 'GROUP',
      duration: '4',
      tripScope: 'BOTH',
      style: budgetPerPerson > 40000 ? 'COMFORT' : 'BUDGET',
      interests: interest || 'BEACH,ADVENTURE',
      month: '2026-11',
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center bg-[#0A0A0A] text-[#F5E6D3]">
      {/* Centered Hero Section */}
      <div
        className="w-full max-w-6xl px-4 sm:px-8 pt-16 sm:pt-24 pb-20 flex flex-col items-center text-center"
        style={{ marginLeft: 'auto', marginRight: 'auto' }}
      >
        {/* Simple Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#D4B896]" />
          Budget-First Travel Intelligence
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-['Outfit'] tracking-tight max-w-3xl leading-tight text-[#F5E6D3]">
          Where can your budget take you?
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-[#A89070] max-w-xl leading-relaxed">
          Tell us your budget and group size. We calculate real flights, hotels, food, and local transit to show where you can realistically go.
        </p>

        {/* Clean, Spacious Search Bar (Centered) */}
        <div
          className="w-full max-w-4xl mt-12 bg-[#151515]/90 border border-[#F5E6D3]/[0.1] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl"
          style={{ marginLeft: 'auto', marginRight: 'auto' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Origin */}
            <div className="p-3.5 rounded-2xl bg-[#F5E6D3]/[0.03] border border-[#F5E6D3]/[0.06] text-left">
              <div className="text-[11px] font-semibold text-[#A89070] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#D4B896]" />
                Leaving From
              </div>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-[#F5E6D3] focus:outline-none cursor-pointer"
              >
                {POPULAR_ORIGINS.map((city) => (
                  <option key={city} value={city} className="bg-[#151515] text-[#F5E6D3]">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Group Size */}
            <div className="p-3.5 rounded-2xl bg-[#F5E6D3]/[0.03] border border-[#F5E6D3]/[0.06] text-left">
              <div className="text-[11px] font-semibold text-[#A89070] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-red-400" />
                Group Size
              </div>
              <select
                value={travelers}
                onChange={(e) => setTravelers(parseInt(e.target.value, 10))}
                className="w-full bg-transparent text-sm font-bold text-[#F5E6D3] focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-[#151515]">Solo (1 Traveler)</option>
                <option value={2} className="bg-[#151515]">Couple (2 People)</option>
                <option value={4} className="bg-[#151515]">4 Friends</option>
                <option value={6} className="bg-[#151515]">6 Friends</option>
                <option value={8} className="bg-[#151515]">8+ Group</option>
              </select>
            </div>

            {/* 3. Budget Per Person */}
            <div className="p-3.5 rounded-2xl bg-[#F5E6D3]/[0.03] border border-[#F5E6D3]/[0.06] text-left">
              <div className="text-[11px] font-semibold text-[#A89070] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-[#D4B896]" />
                Budget Per Person
              </div>
              <select
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(parseInt(e.target.value, 10))}
                className="w-full bg-transparent text-sm font-bold text-[#F5E6D3] focus:outline-none cursor-pointer"
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value} className="bg-[#151515]">
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Big Search Action Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleSearch()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-bold text-base shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Search className="w-5 h-5" />
              Explore Trips Within My Budget
            </button>
          </div>

          {/* Quick Vibe Chips */}
          <div className="mt-4 pt-3 border-t border-[#F5E6D3]/[0.06] flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-[#A89070] mr-1">Popular categories:</span>
            <button
              type="button"
              onClick={() => handleSearch('BEACH')}
              className="px-3 py-1 rounded-full bg-[#F5E6D3]/[0.04] hover:bg-[#F5E6D3]/[0.08] text-[#D4B896] border border-[#F5E6D3]/[0.06] transition-colors"
            >
              🏖️ Beaches
            </button>
            <button
              type="button"
              onClick={() => handleSearch('MOUNTAINS')}
              className="px-3 py-1 rounded-full bg-[#F5E6D3]/[0.04] hover:bg-[#F5E6D3]/[0.08] text-[#D4B896] border border-[#F5E6D3]/[0.06] transition-colors"
            >
              🏔️ Mountains
            </button>
            <button
              type="button"
              onClick={() => handleSearch('NIGHTLIFE')}
              className="px-3 py-1 rounded-full bg-[#F5E6D3]/[0.04] hover:bg-[#F5E6D3]/[0.08] text-[#D4B896] border border-[#F5E6D3]/[0.06] transition-colors"
            >
              🎉 Nightlife
            </button>
            <button
              type="button"
              onClick={() => handleSearch('RELAXATION')}
              className="px-3 py-1 rounded-full bg-[#F5E6D3]/[0.04] hover:bg-[#F5E6D3]/[0.08] text-[#D4B896] border border-[#F5E6D3]/[0.06] transition-colors"
            >
              🧘 Relaxing
            </button>
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="mt-16 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-[#F5E6D3]/[0.06]">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5E6D3]">Realistic Pricing</h3>
            <p className="text-xs text-[#A89070] max-w-xs leading-relaxed">
              We only show places that genuinely fit within your budget limit.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4B896]/10 text-[#D4B896] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5E6D3]">All Costs Included</h3>
            <p className="text-xs text-[#A89070] max-w-xs leading-relaxed">
              Roundtrip flights/trains, stays, meals, and local cabs are factored in.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4B896]/10 text-[#D4B896] flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5E6D3]">Group Split Savings</h3>
            <p className="text-xs text-[#A89070] max-w-xs leading-relaxed">
              Room sharing and shared road trip fuel reduce the cost per person.
            </p>
          </div>
        </div>

        {/* Trending Destinations Row (Clean, Centered, Spacious) */}
        <div className="mt-20 w-full max-w-5xl text-left">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-['Outfit'] text-[#F5E6D3]">
                Popular Destinations
              </h2>
              <p className="text-xs text-[#A89070] mt-1">
                Estimated all-inclusive prices for 4 travelers
              </p>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {POPULAR_DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                href={`/destination/${dest.slug}`}
                className="group bg-[#151515] border border-[#F5E6D3]/[0.08] hover:border-red-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all flex flex-col"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={dest.img}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent" />
                  <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-black/60 text-[#F5E6D3] backdrop-blur-sm">
                    {dest.tag}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-base font-bold text-[#F5E6D3] group-hover:text-red-300 transition-colors">
                    {dest.name}
                  </h3>
                  <div className="pt-2 mt-2 border-t border-[#F5E6D3]/[0.06] flex items-center justify-between text-xs">
                    <span className="text-[#A89070]">{dest.duration}</span>
                    <span className="font-bold text-red-300 font-mono">
                      From {dest.cost} / pax
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Clean Global Footer */}
      <Footer />
    </div>
  );
}
