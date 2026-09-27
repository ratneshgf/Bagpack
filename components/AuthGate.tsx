'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === '/auth');

  useEffect(() => {
    if (pathname === '/auth') {
      // The auth page is public and does not need a session check.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }

      setReady(true);
    });
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen w-full bg-[#f7f1e8] flex items-center justify-center">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-[#f04b3e] animate-pulse">
          Loading BagPack
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
