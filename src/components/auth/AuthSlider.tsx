'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithEmail } from '@/lib/auth/login';
import { signUpWithRestaurant, SignUpData } from '@/lib/auth/signup';
import { getSafeReturnPath } from '@/lib/auth/return-path';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface AuthSliderProps {
  defaultMode?: 'login' | 'signup';
}

export default function AuthSlider({ defaultMode = 'login' }: AuthSliderProps) {
  const configError =
    'App configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.';
  const [isSignup, setIsSignup] = useState(defaultMode === 'signup');
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(
    () => getSafeReturnPath(searchParams?.get('next')),
    [searchParams]
  );

  // State for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // State for Signup
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    owner_name: '',
    restaurant_name: '',
    phone: '',
    address: '',
  });
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setLoginError(configError);
      return;
    }
    if (isOffline) return;
    setLoginError(null);
    setIsLoginSubmitting(true);
    const { error } = await loginWithEmail(loginEmail, loginPassword);
    if (error) {
      setLoginError(error);
      setIsLoginSubmitting(false);
    } else {
      router.replace(returnTo);
    }
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setSignUpError(configError);
      return;
    }
    if (isOffline) return;
    setSignUpError(null);
    setIsSignUpSubmitting(true);
    try {
      const { session } = await signUpWithRestaurant(signUpData);
      if (session) {
        router.replace(returnTo);
        return;
      }
      setSignUpSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setSignUpError(errorMessage);
    } finally {
      setIsSignUpSubmitting(false);
    }
  };

  const toggleMode = () => {
    const query = searchParams?.toString() ?? '';
    const suffix = query ? `?${query}` : '';
    router.replace(`${isSignup ? '/login' : '/signup'}${suffix}`);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 selection:bg-[#6DBE45] selection:text-white">
      {isOffline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-6 py-3 rounded-lg shadow-lg z-50 font-medium">
          You are offline. Please reconnect to continue.
        </div>
      )}
      {!isSupabaseConfigured && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-6 py-3 rounded-lg shadow-lg z-50 font-medium text-center">
          Supabase env vars are missing. Add them in `.env.local` and restart `npm run dev`.
        </div>
      )}

      {/* Main Container - The double slider layout */}
      <div className="relative w-full max-w-5xl h-[700px] md:h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top,0px))] z-[60] inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-gray-700 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white md:absolute md:left-4 md:top-4 md:backdrop-blur-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        {/* =========================================
            MOBILE VIEW (stacked / conditional rendering)
            ========================================= */}
        <div className="md:hidden flex-1 overflow-y-auto">
          {/* We just toggle between the two forms on mobile without fancy physical sliding */}
          {isSignup ? (
            <div className="p-8 w-full">
              {signUpSuccess ? (
                 <div className="text-center py-12">
                   <h2 className="text-2xl font-bold text-[#6DBE45]">Registration Successful!</h2>
                   <p className="mt-2 text-gray-600">Please check your email to confirm.</p>
                   <button onClick={toggleMode} className="mt-6 font-semibold text-[#6DBE45] hover:underline">Go to Login</button>
                 </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-center text-[#6DBE45] mb-6">Create Account</h2>
                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <input name="owner_name" type="text" placeholder="Owner's Name" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                    <input name="restaurant_name" type="text" placeholder="Restaurant Name" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                    <input name="email" type="email" placeholder="Email" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                    <input name="password" type="password" placeholder="Password" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                    <input name="phone" type="tel" placeholder="Phone Number" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                    <input name="address" type="text" placeholder="Address" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                    
                    {signUpError && <p className="text-red-500 text-sm text-center">{signUpError}</p>}
                    
                    <button type="submit" disabled={isSignUpSubmitting || !isSupabaseConfigured} className="w-full bg-[#6DBE45] text-white rounded-full py-3 font-semibold uppercase tracking-wide hover:bg-[#5aa337] transition-colors flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSignUpSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign Up
                    </button>
                  </form>
                  <p className="mt-6 text-center text-gray-600">
                    Already have an account? <button onClick={toggleMode} className="text-[#6DBE45] font-semibold hover:underline">Log In</button>
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="p-8 w-full min-h-full flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-center text-[#6DBE45] mb-6">Sign in to QuickBiteQR</h2>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <input type="email" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                <input type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                
                {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                
                <div className="flex justify-center mt-2">
                   <button type="button" className="text-gray-500 text-sm hover:text-[#6DBE45] hover:underline mb-4 border-b border-transparent">Forgot your password?</button>
                </div>

                <button type="submit" disabled={isLoginSubmitting || !isSupabaseConfigured} className="w-full bg-[#6DBE45] text-white rounded-full py-3 font-semibold uppercase tracking-wide hover:bg-[#5aa337] transition-colors flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoginSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </button>
              </form>
              <p className="mt-8 text-center text-gray-600">
                Don't have an account? <button onClick={toggleMode} className="text-[#6DBE45] font-semibold hover:underline">Sign Up</button>
              </p>
            </div>
          )}
        </div>

        {/* =========================================
            DESKTOP VIEW (Sliding double panels)
            ========================================= */}
        <div className="hidden md:flex w-full h-full relative">
          
          {/* SIGN IN FORM (STATIC ON LEFT) */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white flex flex-col justify-center items-center p-12 transition-all duration-700">
             <h2 className="text-4xl font-bold text-[#6DBE45] mb-4">Sign in</h2>
             <form onSubmit={handleLoginSubmit} className="w-full max-w-sm flex flex-col space-y-4">
                <input type="email" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                <input type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 transition-all placeholder:text-gray-400" />
                
                {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                
                {/* <button type="button" className="text-gray-500 text-sm hover:text-[#6DBE45] self-center my-2">Forgot your password?</button> */}
                
                <button type="submit" disabled={isLoginSubmitting || !isSupabaseConfigured} className="bg-[#6DBE45] text-white rounded-full py-3.5 px-12 font-bold uppercase tracking-widest hover:bg-[#5aa337] transition-all self-center mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoginSubmitting ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Sign In'}
                </button>
             </form>
          </div>

          {/* SIGN UP FORM (STATIC ON RIGHT) */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white flex flex-col justify-center items-center p-10 overflow-y-auto overflow-x-hidden transition-all duration-700">
            {signUpSuccess ? (
              <div className="text-center w-full max-w-sm">
                <h2 className="text-3xl font-bold text-[#6DBE45] mb-4">Registration Successful!</h2>
                <p className="text-gray-500 mb-8">Please check your email to confirm your account.</p>
                <button onClick={toggleMode} className="bg-[#6DBE45] text-white rounded-full py-3.5 px-12 font-bold uppercase tracking-widest hover:bg-[#5aa337] transition-all">Go to Login</button>
              </div>
            ) : (
             <>
               <h2 className="text-3xl font-bold text-[#6DBE45] mb-3">Create Account</h2>
               <form onSubmit={handleSignUpSubmit} className="w-full max-w-sm flex flex-col space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input name="owner_name" type="text" placeholder="Owner's Name" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 placeholder:text-gray-400 text-sm" />
                    <input name="restaurant_name" type="text" placeholder="Restaurant Name" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 placeholder:text-gray-400 text-sm" />
                  </div>
                  <input name="email" type="email" placeholder="Email" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 placeholder:text-gray-400 text-sm" />
                  <input name="password" type="password" placeholder="Password" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 placeholder:text-gray-400 text-sm" />
                  <input name="phone" type="tel" placeholder="Phone Number" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 placeholder:text-gray-400 text-sm" />
                  <input name="address" type="text" placeholder="Address" required onChange={handleSignUpChange} className="w-full bg-gray-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/50 placeholder:text-gray-400 text-sm" />
                  
                  {signUpError && <p className="text-red-500 text-sm text-center pt-2">{signUpError}</p>}
                  
                  <button type="submit" disabled={isSignUpSubmitting || !isSupabaseConfigured} className="bg-[#6DBE45] text-white rounded-full py-3.5 px-12 font-bold uppercase tracking-widest hover:bg-[#5aa337] transition-all self-center mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSignUpSubmitting ? <Loader2 className="h-5 w-5 animate-spin inline" /> : 'Sign Up'}
                  </button>
               </form>
             </>
            )}
          </div>

          {/* OVERLAY PANEL (THE GREEN SLIDING PART) */}
          {/* 
              When isSignup is FALSE (we are logging in): The overlay should cover the RIGHT side (the sign up form), so we can see the Login form on the left.
              When isSignup is TRUE (we are signing up): The overlay should cover the LEFT side (the login form), so we can see the Sign up form on the right.
          */}
          <motion.div 
            className="absolute top-0 right-0 w-1/2 h-full z-50 bg-[#6DBE45] text-white overflow-hidden shadow-2xl flex items-center justify-center"
            initial={false}
            animate={{ x: isSignup ? '-100%' : '0%' }}
            transition={{ type: 'tween', duration: 0.6, ease: 'easeInOut' }}
            style={{ borderRadius: isSignup ? '0 2rem 2rem 0' : '2rem 0 0 2rem' }}
          >
            <AnimatePresence mode="wait">
              {isSignup ? (
                <motion.div 
                  key="welcomeBack"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col justify-center items-center p-12 text-center"
                >
                  <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
                  <p className="text-white/90 text-sm mb-10 max-w-[250px] leading-relaxed">
                    To keep connected with us please login with your personal info
                  </p>
                  <button 
                    onClick={toggleMode}
                    className="bg-transparent border-2 border-white text-white rounded-full py-3 px-12 font-bold uppercase tracking-widest hover:bg-white hover:text-[#6DBE45] transition-all"
                  >
                    Sign In
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="helloFriend"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col justify-center items-center p-12 text-center"
                >
                  <h2 className="text-4xl font-bold mb-6">Hello, Friend!</h2>
                  <p className="text-white/90 text-sm mb-10 max-w-[250px] leading-relaxed">
                    Enter your personal details and start journey with us
                  </p>
                  <button 
                    onClick={toggleMode}
                    className="bg-transparent border-2 border-white text-white rounded-full py-3 px-12 font-bold uppercase tracking-widest hover:bg-white hover:text-[#6DBE45] transition-all"
                  >
                    Sign Up
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
