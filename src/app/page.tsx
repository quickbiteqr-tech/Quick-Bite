'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Instagram, Linkedin, UserCircle2, X, Loader2 } from 'lucide-react';
import ContactModal from '@/components/ContactModal';
import HelpModal from '@/components/HelpModal';
import { supabase } from '@/lib/supabase/client';
import { signUpWithRestaurant, type SignUpData } from '@/lib/auth/signup';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const AnimatedPhoneMockup = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoaded(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-[#F8FAFC] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-[10px] border-white overflow-hidden aspect-[9/19] w-full max-w-[300px] mx-auto flex flex-col ring-1 ring-slate-100">
      
      {/* Top Status Bar (Fake) */}
      <div className="h-6 w-full flex justify-center items-center px-5 pt-2 mb-2 z-20">
         <span className="text-[10px] font-bold text-slate-800">9:41</span>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
          <div className="px-5 pt-4 pb-4">
            <h3 className="text-[26px] font-bold text-slate-800 mb-4 font-serif">Our Menu</h3>
            
            {/* Category Pills */}
            <div className="flex gap-2 mb-2 overflow-hidden">
               <div className="px-4 py-1.5 bg-[#6DBE45] text-white text-xs font-bold rounded-full shadow-sm">Burgers</div>
               <div className="px-4 py-1.5 bg-white text-slate-500 text-xs font-bold rounded-full shadow-sm">Drinks</div>
            </div>
          </div>

        <div className="flex-1 px-5 relative h-full">
         <AnimatePresence mode="wait">
          {!isLoaded ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 px-5 flex flex-col gap-4 mt-2"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded-[1.25rem] shadow-sm flex justify-between items-center w-full min-h-[80px]">
                   <div className="w-12 h-12 bg-slate-100 rounded-full shrink-0 flex items-center justify-center shadow-inner animate-pulse"></div>
                   <div className="flex-1 ml-4 space-y-2">
                     <div className="h-3 w-2/3 bg-slate-100 rounded-full animate-pulse"></div>
                     <div className="h-2 w-1/3 bg-slate-50 rounded-full animate-pulse"></div>
                   </div>
                   <div className="h-4 w-10 bg-slate-100 rounded-full animate-pulse ml-2"></div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="loaded"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 px-5 flex flex-col gap-4 mt-2 mb-20 overflow-y-auto"
            >
              {[
                {name: "Spicy Burger", desc: "Crispy chicken & cheese", price: "$12", color: "bg-orange-50", ring: "ring-orange-100", initial: "S" },
                {name: "Caesar Salad", desc: "Fresh greens & croutons", price: "$9", color: "bg-green-50", ring: "ring-green-100", initial: "C" },
                {name: "Truffle Fries", desc: "Golden & crispy", price: "$6", color: "bg-amber-50", ring: "ring-amber-100", initial: "T" }
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.15 + 0.1, duration: 0.4 }} 
                  key={i} 
                  className="bg-white p-3.5 rounded-[1.25rem] shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex justify-between items-center w-full ring-1 ring-slate-50 group hover:shadow-md transition-shadow cursor-pointer min-h-[80px]"
                >
                  <div className={`w-12 h-12 ${item.color} rounded-full mr-4 shrink-0 flex items-center justify-center ring-4 ${item.ring}`}>
                    <span className="text-sm font-bold text-slate-600">{item.initial}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[15px] text-slate-800 tracking-tight">{item.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                  <div className="font-bold text-[#6DBE45] ml-2 text-lg">{item.price}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white to-transparent z-30 pointer-events-none" />
    </div>
  );
};

export default function Home() {
  const WHATSAPP_NUMBER = '919999999999';
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi QuickBiteQR, I want to know more about your platform.')}`;

  const [scrolled, setScrolled] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSignupGateOpen, setIsSignupGateOpen] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    owner_name: '',
    restaurant_name: '',
    phone: '',
    address: '',
  });
  const [faqExpanded, setFaqExpanded] = useState<boolean[]>(new Array(4).fill(false));
  const [isAuthed, setIsAuthed] = useState(false);
  const [avatarLabel, setAvatarLabel] = useState<string>('U');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setUserState = (user: any | null) => {
      if (!isMounted) return;
      setIsAuthed(Boolean(user));
      setIsSignupGateOpen(!user);
      const rawLabel =
        user?.user_metadata?.owner_name ||
        user?.user_metadata?.restaurant_name ||
        user?.email ||
        'U';
      const nextLabel = String(rawLabel).trim().charAt(0).toUpperCase() || 'U';
      setAvatarLabel(nextLabel);
    };

    supabase.auth.getUser().then(({ data }) => setUserState(data.user)).catch(() => setUserState(null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserState(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const toggleFaq = (index: number) => {
    setFaqExpanded(prev => prev.map((e, i) => i === index ? !e : e));
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({ ...prev, [name]: value }));
  };

  const handleLandingSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setSignupError('Supabase is not configured. Add env keys and restart the server.');
      return;
    }

    setSignupError(null);
    setIsSignupSubmitting(true);
    try {
      await signUpWithRestaurant(signUpData);
      setSignupSuccess(true);
      setIsSignupGateOpen(false);
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  const fadeInUp = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1 },
  };

  // Content Arrays from original
  const steps = [
    { step: 1, title: 'Create your account', desc: 'Sign up with your email and basic restaurant details. It takes less than a minute.', href: '/signup' },
    { step: 2, title: 'Add menu & items', desc: 'Create categories, add items, prices, images and availability from the dashboard.', href: '/dashboard/menu' },
    { step: 3, title: 'Generate QRs', desc: 'Create unlimited QRs and print. Place one on each table.', href: '/dashboard/tables' },
    { step: 4, title: 'Take orders', desc: 'Guests scan, browse, and place orders. Orders appear live.', href: '/dashboard/orders' },
    { step: 5, title: 'Track insights', desc: 'Monitor total revenue, popular items, and peak hours.', href: '/dashboard' }
  ];

  const actions = [
    { title: 'Generate QRs', desc: 'Create custom QR codes for each table.', prep: '1 Min', diff: 'Easy', icon: '/scanner.png' },
    { title: 'Manage Menu', desc: 'Update your menu, prices, and photos dynamically.', prep: 'Live', diff: 'Easy', icon: '/fork.png' },
    { title: 'Track Orders', desc: 'Monitor live orders and manage your queue.', prep: 'Real-time', diff: 'Auto', icon: '/history.png' }
  ];

  const features = [
    { title: 'Faster Turns', desc: 'Speed up table turnarounds by 40% with instant self-ordering.', icon: '/clock.png' },
    { title: 'Higher AOV', desc: 'Increase average order value by +25% with digital upselling.', icon: '/order-food.png' },
    { title: 'Zero Print Cost', desc: 'Eliminate paper menu printing and update items on the fly.', icon: '/menu.png' },
    { title: 'Easy Setup', desc: 'No app download required. Setup your dashboard in 5 mins.', icon: '/mobile-phone.png' }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white overflow-x-hidden">
      {isSignupGateOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-black/5">
            <div className="bg-gradient-to-r from-[#6DBE45]/15 via-[#6DBE45]/8 to-transparent px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
              <div className="mb-4 flex items-center gap-3">
                <Image
                  src="/quickbitelogo.png"
                  alt="QuickBiteQR logo"
                  width={170}
                  height={46}
                  className="h-9 w-auto"
                  priority
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Welcome to QuickBiteQR</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Start your digital ordering setup in under a minute. Create your account to unlock QR menus, live orders, and restaurant insights.
              </p>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <button
              type="button"
              aria-label="Close signup popup"
              onClick={() => setIsSignupGateOpen(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            {signupSuccess ? (
              <div className="py-10 text-center">
                <h2 className="text-2xl font-bold text-[#6DBE45]">Account created successfully</h2>
                <p className="mt-2 text-sm text-slate-500">You can continue to explore or open your dashboard.</p>
              </div>
            ) : (
              <>
                {!isSupabaseConfigured && (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Supabase env vars are missing. Add them in `.env.local` and restart the app.
                  </p>
                )}

                <form onSubmit={handleLandingSignUpSubmit} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input name="owner_name" type="text" placeholder="Owner name" required onChange={handleSignUpChange} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#6DBE45]/50 focus:bg-white focus:ring-2 focus:ring-[#6DBE45]/20" />
                  <input name="restaurant_name" type="text" placeholder="Restaurant name" required onChange={handleSignUpChange} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#6DBE45]/50 focus:bg-white focus:ring-2 focus:ring-[#6DBE45]/20" />
                  <input name="phone" type="tel" placeholder="Phone number" required onChange={handleSignUpChange} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#6DBE45]/50 focus:bg-white focus:ring-2 focus:ring-[#6DBE45]/20" />
                  <input name="address" type="text" placeholder="Address" required onChange={handleSignUpChange} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#6DBE45]/50 focus:bg-white focus:ring-2 focus:ring-[#6DBE45]/20" />
                  <input name="email" type="email" placeholder="Email" required onChange={handleSignUpChange} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#6DBE45]/50 focus:bg-white focus:ring-2 focus:ring-[#6DBE45]/20 sm:col-span-2" />
                  <input name="password" type="password" placeholder="Password" required onChange={handleSignUpChange} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#6DBE45]/50 focus:bg-white focus:ring-2 focus:ring-[#6DBE45]/20 sm:col-span-2" />

                  {signupError && <p className="sm:col-span-2 text-sm text-red-600">{signupError}</p>}

                  <button
                    type="submit"
                    disabled={isSignupSubmitting || !isSupabaseConfigured}
                    className="sm:col-span-2 mt-1 inline-flex items-center justify-center rounded-full bg-[#6DBE45] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5aa337] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSignupSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
                  <span className="text-slate-500">Have an account?</span>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-[#6DBE45]/40 px-4 py-1.5 font-semibold text-[#4e9539] transition-colors hover:bg-[#6DBE45]/10"
                  >
                    Login
                  </Link>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* Navigation — middle row scrolls horizontally on small screens to avoid wrap overflow */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent py-2'}`}>
         <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between lg:h-20 py-2.5 sm:py-3 lg:py-0">
               <div className="flex justify-between items-center gap-3 min-w-0">
				 <Link href="/" className="flex items-center min-w-0 flex-1">
           <Image
             src="/quickbitelogo.png"
             alt="QuickBiteQR logo"
             width={180}
             height={48}
             priority
             className="h-9 w-auto sm:h-10"
           />
         </Link>
                  <div className="flex items-center gap-2 sm:gap-3 lg:hidden shrink-0">
                     {isAuthed ? (
                       <Link
                         href="/dashboard"
                         aria-label="Go to dashboard"
                         title="Dashboard"
                         className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-[#6DBE45]/40 hover:text-[#6DBE45] transition-colors"
                       >
                         <span className="sr-only">Dashboard</span>
                         <span className="text-sm font-bold">{avatarLabel}</span>
                       </Link>
                     ) : (
                       <>
                         <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[#6DBE45]">Login</Link>
                         <Link href="/signup" className="text-sm font-bold bg-[#6DBE45] text-white px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-[#5aa337] transition-colors whitespace-nowrap">Start Free Trial</Link>
                       </>
                     )}
                  </div>
               </div>

               <div className="w-full min-w-0 lg:flex-1 lg:flex lg:justify-center">
                  <div
                    className="flex items-center gap-1 sm:gap-2 lg:gap-8 overflow-x-auto overflow-y-hidden border-t border-slate-100/80 pt-2.5 lg:border-0 lg:pt-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
                  >
                    <Link href="#hero" className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] sm:text-[15px] font-semibold text-[#6DBE45] lg:rounded-none lg:px-0 lg:py-0 lg:border-b-2 lg:border-[#6DBE45] lg:pb-1">Home</Link>
                    <Link href="/get-website" className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] sm:text-[15px] font-medium text-slate-600 hover:text-[#6DBE45] transition-colors">Get a website</Link>
                    <Link href="#actions" className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] sm:text-[15px] font-medium text-slate-600 hover:text-[#6DBE45] transition-colors">Features</Link>
                    <Link href="#how-it-works" className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] sm:text-[15px] font-medium text-slate-600 hover:text-[#6DBE45] transition-colors">How it Works</Link>
                    <Link href="#faq" className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] sm:text-[15px] font-medium text-slate-600 hover:text-[#6DBE45] transition-colors">FAQ</Link>
                    <button type="button" onClick={() => setIsContactModalOpen(true)} className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] sm:text-[15px] font-medium text-slate-600 hover:text-[#6DBE45] transition-colors">Contact</button>
                  </div>
               </div>

               <div className="hidden lg:flex items-center gap-4 shrink-0">
                  {/* <Link href="/get-website" className="text-sm font-medium text-slate-600 hover:text-[#6DBE45]">Get a website</Link> */}
                  {isAuthed ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 hover:ring-[#6DBE45]/40 transition-colors"
                      aria-label="Go to dashboard"
                      title="Dashboard"
                    >
                      <UserCircle2 className="h-5 w-5 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">Account</span>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[#6DBE45]">Login</Link>
                      <Link href="/signup" className="text-sm font-bold bg-[#6DBE45] text-white px-6 py-2.5 rounded-full hover:bg-[#5aa337] transition-colors">Start Free Trial</Link>
                    </>
                  )}
               </div>
            </div>
         </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative w-full min-w-0 pt-32 sm:pt-36 lg:pt-40 pb-10 sm:pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-20">
         {/* Decorative leaf — hidden on narrow screens to avoid horizontal scroll */}
         <div className="hidden md:block absolute top-40 left-0 w-32 h-64 -translate-x-8 lg:-translate-x-16 bg-[url('https://images.unsplash.com/photo-1596781290333-e575de2db7c3?auto=format&fit=crop&q=80&w=300')] bg-no-repeat bg-contain opacity-20 pointer-events-none rounded-r-3xl" style={{ filter: 'grayscale(100%) sepia(100%) hue-rotate(50deg) saturate(300%)' }}></div>

         {/* Left text */}
         <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex-1 w-full min-w-0 text-center lg:text-left z-10">
            <h1 className="text-[clamp(1.7rem,5.5vw,4.5rem)] leading-[1.1] text-slate-900 tracking-tight font-serif mb-4 sm:mb-6 px-1 text-balance mx-auto lg:mx-0 w-full min-w-0">
               TRANSFORM <br /> YOUR RESTAURANT <br />
               <span className="text-[#6DBE45]">EXPERIENCE</span>
            </h1>
            <p className="text-slate-500 text-base sm:text-lg mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans px-0 sm:px-0">
               Eliminate wait times, reduce errors, and delight customers with our seamless QR code ordering system. Set up in minutes, scale effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
               <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-50 text-[#25D366] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg font-serif font-bold tracking-wide transition-all shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-[#25D366]/45 inline-flex items-center justify-center gap-2 text-center"
               >
                  <Image src="/whatsapp.png" alt="" width={20} height={20} className="h-5 w-5" aria-hidden />
                  Connect with us
               </a>
            </div>
         </motion.div>

         {/* Right Image/Video masked circularly */}
         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="flex-1 relative w-full min-w-0 max-w-[min(100%,28rem)] mx-auto lg:mx-0 shrink-0">
            {/* Pop-up UI floating element */}
            <div className="absolute top-10 -left-10 z-20 hidden rounded-xl bg-white px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:block">
               <div className="text-sm font-bold text-slate-800">40% Faster Service</div>
               <div className="text-xs text-slate-400">Join thousands of owners</div>
            </div>

            {/* Circular Masked container */}
            <div className="relative w-full aspect-square rounded-full border-[8px] sm:border-[12px] lg:border-[16px] border-white shadow-2xl overflow-hidden z-10 bg-slate-50">
               <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover scale-[1.02]">
                  <source src="/images/QrCode (2).mp4" type="video/mp4" />
               </video>
            </div>
         </motion.div>
      </section>

      {/* WHAT IS THIS EXPLAINER SECTION */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100">
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 mb-4 sm:mb-6 px-1">Wait, what exactly is QuickBiteQR?</h2>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto px-1">
               It is incredibly simple. We replace your old paper menus with a powerful digital ordering system. You do the setup, and we handle the magic.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100">
                  <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mb-6">1</div>
                  <h3 className="font-bold text-xl text-slate-800 mb-3">Add Your Menu</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Type in your dishes, set the prices, and upload a delicious photo. It's as easy as posting on social media.</p>
               </motion.div>
               
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100">
                  <div className="w-14 h-14 bg-green-50 text-[#6DBE45] rounded-full flex items-center justify-center text-2xl font-bold mb-6">2</div>
                  <h3 className="font-bold text-xl text-slate-800 mb-3">Create Tables</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Tell the dashboard how many tables you have. We automatically generate a unique, printable QR code for each one.</p>
               </motion.div>
               
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold mb-6">3</div>
                  <h3 className="font-bold text-xl text-slate-800 mb-3">Guests Order</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Customers sit down, scan the code with their smartphone camera, and order. You see the order instantly in your kitchen.</p>
               </motion.div>
            </div>
         </div>
      </section>

      {/* "OUR RECIPES" mapped to QUICK ACTIONS */}
      <section id="actions" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative text-center">
         <div className="flex flex-col items-center mb-10 sm:mb-16 px-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-wider uppercase">Quick Actions</h2>
            <p className="text-slate-400 mt-2 max-w-md text-sm sm:text-base">Everything you need to manage your restaurant seamlessly</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-4 sm:pt-2">
            {actions.map((act, idx) => (
               <motion.div 
                  key={idx} 
                  initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 pt-16 sm:pt-10 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 hover:shadow-[0_15px_50px_rgba(109,190,69,0.1)] transition-all duration-300 relative group"
               >
                  {/* Round feature image/icon simulating the recipe plate */}
                  <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-50 shadow-md flex items-center justify-center p-5 sm:p-6 border-4 border-white group-hover:scale-105 transition-transform">
                     <Image src={act.icon} alt={act.title} width={60} height={60} className="w-12 h-12 opacity-80" />
                  </div>
                  
                  <p className="mt-14 mb-4 text-center text-xs font-semibold uppercase tracking-wider text-[#6DBE45]">5 / 5</p>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{act.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 sm:mb-8 leading-relaxed min-h-[3rem] sm:h-12 sm:min-h-0">{act.desc}</p>
                  
                  <div className="flex justify-between items-center border-t border-slate-100 pt-5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                     <div className="flex flex-col items-center text-center">
                        <span className="mb-1 text-[10px] text-slate-500">Prep</span>
                        {act.prep}
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <span className="mb-1 text-[10px] text-slate-500">Ease</span>
                        {act.diff}
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <span className="mb-1 text-[10px] text-slate-500">Team</span>
                        All Staff
                     </div>
                  </div>
               </motion.div>
            ))}
         </div>
      </section>

      {/* "OUR AWESOME SERVICES" mapped to FEATURES KPI */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 text-center">
         <div className="max-w-4xl mx-auto px-1">
            <p className="text-[#6DBE45] text-xs font-bold tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-wider uppercase mb-10 sm:mb-16">Why QuickBiteQR?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-10 sm:gap-y-16 text-left">
               {features.map((feat, idx) => (
                  <motion.div key={idx} initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp} className="flex gap-4 sm:gap-6 items-start">
                     <div className="shrink-0 w-16 h-16 opacity-80">
                        <Image src={feat.icon} alt={feat.title} width={64} height={64} className="w-full h-full object-contain" style={{ filter: 'grayscale(100%) brightness(0)' }} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* "DISCOVER OUR STORY" mapped to HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
         {/* Left Side Visual - Animated CSS Phone Mockup */}
         <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 w-full max-w-[280px] sm:max-w-md mx-auto relative flex justify-center py-4 sm:py-8">
            <div className="absolute inset-0 bg-[#6DBE45] rounded-full opacity-10 blur-3xl scale-75"></div>
            
            {/* The new interactive phone animation replaces the video block */}
            <AnimatedPhoneMockup />

            {/* Organic leaf accent at bottom — toned down on small screens */}
            <div className="hidden sm:block absolute -bottom-10 -left-10 w-40 h-40 bg-[url('https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=200')] bg-no-repeat bg-contain opacity-40 mix-blend-multiply pointer-events-none rounded-full z-10" style={{ filter: 'grayscale(100%) sepia(100%) hue-rotate(50deg) saturate(300%)' }}></div>
         </motion.div>

         {/* Right Side Info */}
         <div className="flex-1 w-full min-w-0 text-center md:text-left">
            <p className="text-[#6DBE45] text-xs font-bold tracking-widest uppercase mb-4">How It Works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-8 sm:mb-10 text-balance">
               Discover The <br /> QuickBite Process
            </h2>
            <div className="space-y-6 sm:space-y-8 text-left">
               {steps.slice(0,4).map((s, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="flex gap-3 sm:gap-4">
                     <div className="w-8 h-8 rounded-full bg-[#6DBE45]/10 text-[#6DBE45] flex items-center justify-center font-bold shrink-0">{s.step}</div>
                     <div>
                        <h4 className="text-base font-bold text-slate-900 mb-1 leading-none">{s.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                     </div>
                  </motion.div>
               ))}
               <Link href="/signup" className="inline-block mt-4 text-[#6DBE45] font-bold uppercase tracking-wider text-sm border-b-2 border-[#6DBE45] pb-1 hover:text-slate-900 transition-colors">Start Using Now</Link>
            </div>
         </div>
      </section>

      {/* FREE WEBSITE SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16 border-t border-slate-50">
         {/* Right Side Visual - Laptop Mockup */}
         <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 w-full min-w-0 relative group flex justify-center">
             <div className="absolute inset-0 bg-[#6DBE45] rounded-2xl sm:rounded-3xl rotate-3 opacity-5 group-hover:rotate-6 transition-transform duration-500"></div>
             <div className="relative bg-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 aspect-[16/10] overflow-hidden w-full max-w-[500px]">
                {/* Fake browser header */}
                <div className="flex gap-1.5 mb-2.5 px-1">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                {/* Fake website content */}
                <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex flex-col gap-3 relative overflow-hidden">
                   {/* Logo / Nav */}
                   <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div className="w-20 h-4 bg-[#6DBE45] rounded flex items-center justify-center">
                         <span className="text-[8px] font-bold text-white tracking-widest uppercase">Your Logo</span>
                      </div>
                      <div className="flex gap-2">
                         <div className="w-8 h-3 bg-slate-100 rounded-full"></div>
                         <div className="w-8 h-3 bg-slate-100 rounded-full"></div>
                         <div className="w-8 h-3 bg-[#6DBE45]/20 rounded-full"></div>
                      </div>
                   </div>
                   {/* Hero */}
                   <div className="h-28 bg-slate-50 rounded-lg flex items-center justify-center p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center opacity-30 blur-[2px]"></div>
                      <div className="w-full max-w-[85%] space-y-2 relative z-10 bg-white/80 p-3 rounded backdrop-blur-sm min-w-0">
                         <div className="h-3 bg-slate-800 rounded-full w-full max-w-full"></div>
                         <div className="h-3 bg-slate-800 rounded-full w-[90%] max-w-full"></div>
                      </div>
                   </div>
                   {/* Gallery */}
                   <div className="grid grid-cols-3 gap-2 flex-1 pt-1">
                      <div className="bg-orange-50 rounded-lg w-full h-full border border-orange-100 flex items-center justify-center"><span className="text-[10px] font-bold text-orange-800/80">A</span></div>
                      <div className="bg-green-50 rounded-lg w-full h-full border border-green-100 flex items-center justify-center"><span className="text-[10px] font-bold text-green-800/80">B</span></div>
                      <div className="bg-amber-50 rounded-lg w-full h-full border border-amber-100 flex items-center justify-center"><span className="text-[10px] font-bold text-amber-800/80">C</span></div>
                   </div>
                   {/* Floating overlay to make it look premium */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                </div>
             </div>
         </motion.div>

         {/* Left Side Info */}
         <div className="flex-1 w-full min-w-0 text-center md:text-left">
            <p className="text-[#6DBE45] text-xs font-bold tracking-widest uppercase mb-4">Bonus Feature</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4 sm:mb-6 text-balance">
               Get a <span className="text-[#6DBE45]">Free Website</span> <br />With Our Software
            </h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
               Why pay thousands for a custom restaurant website? QuickBiteQR automatically generates a stunning, SEO-optimized landing page for your brand the moment you sign up.
            </p>
            
            <div className="space-y-4">
               {[
                  { title: "SEO Optimized", desc: "Rank higher on Google searches automatically." },
                  { title: "Custom Domain", desc: "Connect your own .com address easily." },
                  { title: "Auto-Syncs with Menu", desc: "Update your items once, everywhere." }
               ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                     <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6DBE45]" />
                     <div>
                        <h4 className="font-bold text-slate-800">{item.title}</h4>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-100 text-center relative overflow-hidden">
         {/* Background Decor */}
         <div className="absolute top-0 right-0 w-[min(100vw,500px)] h-[min(100vw,500px)] max-w-[500px] max-h-[500px] bg-[#6DBE45] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         
         <div className="max-w-7xl mx-auto relative z-10">
            <p className="text-[#6DBE45] text-xs font-bold tracking-widest uppercase mb-4">Customer Stories</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-wider uppercase mb-10 sm:mb-16 px-2">Loved by Restaurants Everywhere</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
               {[
                  { quote: "QuickBiteQR completely eliminated our wait times. Our customers love the rich photos and fast ordering.", name: "Sarah Jenkins", role: "Owner, The Rustic Spoon", rating: 5 },
                  { quote: "We basically got a free, gorgeous website on top of the menu system. Incredible value for the price.", name: "Michael Chen", role: "GM, Golden Dragon", rating: 5 },
                  { quote: "Our average order value jumped 25% just because of the automatic upselling. Best decision we made this year.", name: "Elena Rodriguez", role: "Founder, Café Bloom", rating: 5 }
               ].map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.1 }} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 relative group hover:border-[#6DBE45]/30 transition-colors">
                     <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-5xl sm:text-6xl text-slate-50 font-serif leading-none tracking-tighter group-hover:text-[#6DBE45]/10 transition-colors">"</div>
                     <p className="mb-6 text-xs font-semibold text-amber-600">Rating: {t.rating} / 5</p>
                     <p className="text-slate-600 text-[15px] leading-relaxed mb-8 relative z-10">"{t.quote}"</p>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#6DBE45]/10 rounded-full flex items-center justify-center font-bold text-[#6DBE45]">
                           {t.name.charAt(0)}
                        </div>
                        <div>
                           <div className="font-bold text-slate-900">{t.name}</div>
                           <div className="text-xs text-slate-400">{t.role}</div>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ANALYTICS SECTION (Replaced Pricing) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
         {/* Left Side Info */}
         <div className="flex-1 w-full min-w-0 text-center md:text-left">
            <p className="text-[#6DBE45] text-xs font-bold tracking-widest uppercase mb-4">Powerful Insights</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4 sm:mb-6 text-balance">
               Know Exactly What Your <br /><span className="text-[#6DBE45]">Customers Crave</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
               Take the guesswork out of menu planning. Our built-in analytics dashboard tracks every scan, click, and order so you can optimize your offerings and boost profitability.
            </p>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-md mx-auto md:max-w-none md:mx-0">
               <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">+25%</div>
                  <div className="text-xs sm:text-sm text-slate-500 leading-snug">Average Order Value</div>
               </div>
               <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">-40%</div>
                  <div className="text-xs sm:text-sm text-slate-500 leading-snug">Wait Times</div>
               </div>
            </div>
         </div>

         {/* Right Side Visual - Abstract Dashboard Mockup */}
         <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex-1 w-full min-w-0 relative max-w-lg mx-auto md:max-w-none">
             <div className="absolute inset-0 bg-[#6DBE45] rounded-2xl sm:rounded-3xl -rotate-3 opacity-5"></div>
             <div className="relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 aspect-[5/4] min-h-[220px] sm:min-h-0 flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1 sm:mb-2">
                   <div className="text-base sm:text-lg font-bold text-slate-800">Sales Overview</div>
                   <div className="px-2 sm:px-3 py-1 bg-slate-100 rounded-full text-[10px] sm:text-xs font-bold text-slate-500 w-fit">This Week ▾</div>
                </div>
                
                {/* Fake Chart */}
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-end gap-2 relative overflow-hidden">
                   {/* Grid lines */}
                   <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-50">
                      <div className="w-full h-px bg-slate-200"></div>
                      <div className="w-full h-px bg-slate-200"></div>
                      <div className="w-full h-px bg-slate-200"></div>
                      <div className="w-full h-px bg-slate-200"></div>
                   </div>
                   {/* Bars */}
                   {[40, 65, 45, 80, 55, 95, 75].map((h, i) => (
                      <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: i*0.1, duration: 0.5 }} className="flex-1 bg-[#6DBE45] rounded-t-sm relative z-10 opacity-90"></motion.div>
                   ))}
                </div>

                {/* Top Items */}
                <div className="flex gap-4">
                   <div className="flex-1 bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600">SB</span>
                      <div>
                         <div className="text-xs font-bold text-slate-800">Spicy Burger</div>
                         <div className="text-[10px] text-slate-500">Top Seller</div>
                      </div>
                   </div>
                   <div className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100 flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600">CS</span>
                      <div>
                         <div className="text-xs font-bold text-slate-800">Caesar Salad</div>
                         <div className="text-[10px] text-slate-500">Trending UP</div>
                      </div>
                   </div>
                </div>
             </div>
         </motion.div>
      </section>

      {/* MASSIVE CTA SECTION */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 lg:px-8 mb-6 sm:mb-10">
         <div className="max-w-6xl mx-auto rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] bg-slate-900 overflow-hidden relative">
            {/* abstract bg */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#6DBE45]/80 to-slate-900/40"></div>
            
            <div className="relative p-8 sm:p-12 lg:p-20 text-center text-white flex flex-col items-center">
               <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4 sm:mb-6 max-w-2xl text-balance px-1">Ready to revolutionize your restaurant?</h2>
               <p className="text-base sm:text-lg text-slate-100/80 max-w-lg mb-8 sm:mb-10 px-1">Join over 5,000 restaurants that have increased their revenue by 25% with QuickBiteQR.</p>
               <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link href="/signup" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform text-center">
                     Get Started Free
                  </Link>
                  <button onClick={() => setIsContactModalOpen(true)} className="px-8 py-4 bg-transparent border-2 border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
                     Talk to Sales
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* FAQ Accordion Styled Cleanly */}
      <section id="faq" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 pb-24 sm:pb-32">
         <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-wider uppercase mb-3 sm:mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm sm:text-base">Everything you need to know about QuickBiteQR.</p>
         </div>

         <div className="max-w-3xl mx-auto space-y-2 sm:space-y-4 px-1">
            {[
               { q: "How quickly can I set up?", a: "Setup takes less than 5 minutes. No technical knowledge required." },
               { q: "Do customers need to download an app?", a: "No! Customers simply scan the QR code with their phone's camera." },
               { q: "Can I customize the menu design?", a: "Yes! You can customize colors, fonts, and layout to match your branding." },
               { q: "Is there a limit on orders or tables?", a: "Free plan supports up to 5 tables. Pro plans offer unlimited tables and orders." }
            ].map((faq, idx) => (
               <div key={idx} className="border-b border-slate-100 pb-2 sm:pb-4">
                  <button type="button" onClick={() => toggleFaq(idx)} className="w-full flex justify-between items-start gap-3 sm:gap-4 py-3 sm:py-4 text-left font-serif font-bold text-base sm:text-lg text-slate-800 hover:text-[#6DBE45] transition-colors">
                     <span className="min-w-0 flex-1 pr-2">{faq.q}</span>
                     <span className={`text-[#6DBE45] text-2xl font-light transition-transform shrink-0 leading-none mt-0.5 ${faqExpanded[idx] ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {faqExpanded[idx] && (
                     <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-slate-500 pb-4">
                        {faq.a}
                     </motion.p>
                  )}
               </div>
            ))}
         </div>
      </section>

      {/* Footer Minimalist */}
      <footer className="bg-slate-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <Image
                src="/quickbitelogo.png"
                alt="QuickBiteQR logo"
                width={220}
                height={60}
                className="h-10 w-auto"
              />
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 sm:gap-6 text-sm font-semibold text-slate-600 max-w-md md:max-w-none">
               <Link href="#hero" className="hover:text-[#6DBE45]">Home</Link>
               <Link href="/get-website" className="hover:text-[#6DBE45]">Get a website</Link>
               <Link href="#actions" className="hover:text-[#6DBE45]">Features</Link>
               <Link href="/login" className="hover:text-[#6DBE45]">Login</Link>
               <button type="button" onClick={() => setIsContactModalOpen(true)} className="hover:text-[#6DBE45]">Contact Us</button>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm font-semibold text-slate-600">
              <Link
                href="https://linkedin.com/company/quickbiteqr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#6DBE45]"
                aria-label="QuickBiteQR on LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/quickbiteqr/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#6DBE45]"
                aria-label="QuickBiteQR on Instagram"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>

            <div className="text-slate-400 text-sm">
               © 2026 QuickBiteQR. All rights reserved.
            </div>
         </div>
      </footer>
    </div>
  );
}