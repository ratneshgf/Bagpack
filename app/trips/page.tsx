'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  Bookmark,
  Calendar,
  Users,
  Wallet,
  Trash2,
  ArrowRight,
  Plane,
  Compass,
  Sparkles,
  MapPin,
} from 'lucide-react';

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
  status: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/trips?id=${id}`, { method: 'DELETE' });
      setTrips(trips.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5E6D3]">
      {/* Header Banner */}
      <div className="border-b border-[#F5E6D3]/[0.08] bg-[#111111] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
              <Bookmark className="w-4 h-4" />
              Saved Group Plans
            </div>
            <h1 className="text-3xl font-black font-['Outfit'] text-white">Your Saved Trips</h1>
            <p className="text-xs text-slate-400 mt-1">
              Compare your group shortlists, review expense allocations, and finalize your booking.
            </p>
          </div>

          <Link
            href="/search"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4" />
            Discover New Trip
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-[#1A1A1A]/50 border border-[#F5E6D3]/[0.05] animate-pulse p-5 space-y-4"
              >
                <div className="h-6 bg-white/[0.05] rounded w-2/3" />
                <div className="h-4 bg-white/[0.05] rounded w-1/2" />
                <div className="h-20 bg-white/[0.03] rounded-xl" />
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">No Saved Trips Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When exploring destinations or running budget searches, click &quot;Save Trip&quot; to keep your
              itineraries and cost models here for your friends to view.
            </p>
            <div className="pt-2">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30"
              >
                <Compass className="w-4 h-4" />
                Start Exploring Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-[#1A1A1A] border border-[#F5E6D3]/[0.08] hover:border-red-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 group transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-teal-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.destinationCity}, {trip.destinationCountry}
                      </div>
                      <h3 className="text-lg font-bold font-['Outfit'] text-white mt-0.5">
                        {trip.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Saved Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.05]">
                      <Users className="w-3.5 h-3.5 text-violet-400" />
                      {trip.travelers} Friends
                    </span>
                    <span className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.05]">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {trip.durationDays} Days
                    </span>
                    <span className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.05]">
                      <Plane className="w-3.5 h-3.5 text-teal-400" />
                      {trip.selectedTransportMode}
                    </span>
                  </div>

                  {/* Budget summary */}
                  <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        Per Person
                      </div>
                      <div className="text-xl font-black font-mono text-white">
                        ₹{trip.estimatedCostPerPerson.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        Total Group
                      </div>
                      <div className="text-sm font-bold font-mono text-teal-300">
                        ₹{trip.totalGroupCost.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Saved {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/destination/${trip.destinationSlug}`}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    View Plan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
