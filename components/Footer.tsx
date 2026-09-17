import Link from 'next/link';
import { Sparkles, PlaneTakeoff } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#F5E6D3]/[0.06] bg-[#080808] py-8 text-xs text-[#A89070]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-red-700 to-red-500 p-0.5">
            <div className="w-full h-full bg-[#0D0D0D] rounded-[4px] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[#F5E6D3]" />
            </div>
          </div>
          <span className="font-bold text-[#F5E6D3] font-['Outfit']">
            BagPack <PlaneTakeoff className="inline-block w-3 h-3 ml-1 text-red-400 -rotate-12" aria-hidden="true" />
          </span>
          <span className="text-[#2E2E2E] mx-1">·</span>
          <span>Budget-First Travel Planning</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link href="/search" className="hover:text-[#D4B896] transition-colors">
            Discover
          </Link>
          <Link href="/compare" className="hover:text-[#D4B896] transition-colors">
            Compare Routes
          </Link>
          <Link href="/trips" className="hover:text-[#D4B896] transition-colors">
            Saved Trips
          </Link>
        </div>

        {/* Copyright */}
        <div>
          © {new Date().getFullYear()} BagPack. All prices in INR.
        </div>
      </div>
    </footer>
  );
}
