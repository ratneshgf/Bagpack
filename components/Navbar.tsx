'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, Sparkles, MapPin, Bookmark, GitCompare, Menu, X, PlaneTakeoff, LogOut } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/auth');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Explore', icon: Compass },
    { href: '/search', label: 'Discover', icon: MapPin },
    { href: '/compare', label: 'Compare Routes', icon: GitCompare },
    { href: '/trips', label: 'Saved Trips', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f7f1e8] border-b-[3px] border-[#161616] transition-all flex justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 border-[3px] border-[#161616] bg-[#f04b3e] p-0.5 shadow-[4px_4px_0_#161616] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[2px_2px_0_#161616] transition-all duration-300">
            <div className="w-full h-full bg-[#f7c948] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#161616] group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center text-xl font-black font-['Outfit'] tracking-tight text-[#161616]">
              BagPack
              <PlaneTakeoff className="ml-1.5 w-3.5 h-3.5 text-red-400 -rotate-12 animate-pulse" aria-hidden="true" />
            </span>
            <div className="text-[10px] text-[#f04b3e] uppercase tracking-wider font-black -mt-1 hidden sm:block">
              Budget-First Travel
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white border-2 border-[#161616] px-3 py-1.5 shadow-[4px_4px_0_#161616]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-red-600/25 text-red-300 border border-red-500/30 shadow-sm shadow-red-500/20'
                    : 'text-[#555] hover:text-[#161616] hover:bg-[#f7c948]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-[#A89070]'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-xs px-2.5 py-1 border-2 border-[#161616] bg-[#8fe3c2] text-[#161616] font-black flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            INR · Live Engine
          </div>
          <Link
            href="/search"
            className="px-4 py-2 border-[3px] border-[#161616] bg-[#f04b3e] text-white text-sm font-black shadow-[4px_4px_0_#161616] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#161616] transition-all duration-200 flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            Plan Trip
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 border-2 border-[#161616] bg-white px-3 py-2 text-xs font-black text-[#161616] hover:bg-[#f7c948]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-[#F5E6D3]/[0.05] border border-[#F5E6D3]/[0.08] text-[#D4B896] hover:text-[#F5E6D3]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#F5E6D3]/[0.08] bg-[#0D0D0D]/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                    : 'text-[#D4B896] hover:text-[#F5E6D3] hover:bg-[#F5E6D3]/[0.05]'
                }`}
              >
                <Icon className="w-4 h-4 text-red-400" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#F5E6D3]/[0.06] flex flex-col gap-2">
            <button type="button" onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 py-2.5 text-sm font-semibold text-red-300">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white text-sm font-semibold shadow-md shadow-red-600/30"
            >
              Plan Trip Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
