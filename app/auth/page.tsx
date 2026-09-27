'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'signin' | 'signup';
export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/');
    });
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    if (mode === 'signup' && name.trim().length < 2) {
      setError('Tell us your name so we can personalize your trips.');
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();

      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setError('Account created. Check your email and confirm your account, then sign in.');
          setPending(false);
          return;
        }

        router.replace('/');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) throw signInError;
      router.replace('/');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
      setPending(false);
    }
  };

  return (
    <main className="relative min-h-screen h-dvh w-full bg-[#f7f1e8] text-[#161616] flex items-center justify-center overflow-hidden px-4 py-4 sm:px-6">
      <div className="absolute inset-0 bg-[url('/images/seven-wonders-hero.png')] bg-cover bg-center opacity-[0.08]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f7c948]/40 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#8fe3c2]/40 blur-3xl" />

      <section className="relative flex w-full max-w-md -translate-y-3 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center justify-center gap-3"><div className="grid h-9 w-9 place-items-center border-[3px] border-[#161616] bg-[#f7c948] shadow-[3px_3px_0_#161616]"><Sparkles className="h-4 w-4" /></div><span className="text-2xl font-black">BagPack</span></div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#f04b3e]">Your next trip starts here</p>
          <h1 className="mt-2 text-4xl font-black leading-none tracking-[-.06em]">{mode === 'signup' ? 'Create your travel base.' : 'Welcome back, traveller.'}</h1>
          <p className="mt-2 font-semibold leading-relaxed text-[#555]">{mode === 'signup' ? 'Join BagPack and turn your budget into a trip worth taking.' : 'Sign in to pick up your saved plans and keep exploring.'}</p>

          <div className="mt-5 grid grid-cols-2 border-[3px] border-[#161616] bg-white p-1 shadow-[4px_4px_0_#161616]">
            {(['signup', 'signin'] as AuthMode[]).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(null); }} className={`py-3 text-sm font-black uppercase tracking-wider ${mode === item ? 'bg-[#f04b3e] text-white' : 'text-[#555]'}`}>{item === 'signup' ? 'Sign up' : 'Sign in'}</button>)}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {mode === 'signup' && <label className="neo-field block"><span className="neo-label"><UserRound className="h-4 w-4" /> Full name</span><input value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-transparent text-base font-bold outline-none" placeholder="Your name" autoComplete="name" /></label>}
            <label className="neo-field block"><span className="neo-label"><Mail className="h-4 w-4" /> Email address</span><input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-base font-bold outline-none" placeholder="you@example.com" type="email" autoComplete="email" /></label>
            <label className="neo-field block"><span className="neo-label"><LockKeyhole className="h-4 w-4" /> Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-base font-bold outline-none" placeholder="At least 8 characters" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>
            {error && <p role="alert" className="border-2 border-[#f04b3e] bg-[#ff6b5f]/20 p-3 text-sm font-bold text-[#a52a20]">{error}</p>}
            <button disabled={pending} className="neo-button neo-button-red w-full py-4 text-base disabled:cursor-wait disabled:opacity-60">{pending ? 'Opening BagPack…' : mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight className="h-5 w-5" /></button>
          </form>
          <p className="mt-4 text-center text-xs font-semibold text-[#777]">By continuing, you agree to plan responsibly and verify prices before booking.</p>
        </div>
      </section>
    </main>
  );
}
