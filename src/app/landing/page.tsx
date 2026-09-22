'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Instagram, Linkedin, UserCircle2, X, Loader2, Youtube } from 'lucide-react';
import ContactModal from '@/components/ContactModal';
import HelpModal from '@/components/HelpModal';
import { supabase } from '@/lib/supabase/client';
import HeroSection from './components/hero';
import HowItWorks from './components/HowItWorks';
import FreeWebsiteGenerator from './components/FreeWebsiteGenerator';
import LiveROIEngine from './components/LiveROIEngine';
import ProofMatrix from './components/ProofMatrix';
import FinalGate from './components/FinalGate';
import { StrategicFAQ, MinimalistFooter } from './components/FAQAndFooter';
import Navbar from './components/Navbar';



export default function Home() {
  
  const [scrolled, setScrolled] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSignupGateOpen, setIsSignupGateOpen] = useState(false);
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


 
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">

      {/* Modals */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* NAVIGATION */}
      <Navbar 
        isAuthed={isAuthed} 
        avatarLabel={avatarLabel} 
        onContactClick={() => setIsContactModalOpen(true)} 
      />

      {/* HERO SECTION */}
      <HeroSection />

      {/* FEATURES SECTION */}
      <div id="features">
        <HowItWorks />
      </div>

      {/* FREE WEBSITE SECTION / PLAYGROUND */}
      <div id="playground">
        <FreeWebsiteGenerator />
      </div>

      {/* LIVE ROI ENGINE (Replaced Analytics) / AUDIT */}
      <div id="audit">
        <LiveROIEngine />
      </div>

      {/* PROOF MATRIX (Replaced Testimonials) / REVIEWS */}
      <div id="reviews">
        <ProofMatrix />
      </div>

      

      {/* THE FINAL GATE */}
      <FinalGate />

      {/* FAQ & FOOTER */}
      <StrategicFAQ />
      <MinimalistFooter />
    </div>
  );
}