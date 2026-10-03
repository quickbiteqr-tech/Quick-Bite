'use client';

import { useState, useEffect } from 'react';
import { ContactDrawer } from '@/components/ContactDrawer';
import HelpModal from '@/components/HelpModal';
import { supabase } from '@/lib/supabase/client';
import HeroSection from './landing/components/hero';
import HowItWorks from './landing/components/HowItWorks';
import FreeWebsiteGenerator from './landing/components/FreeWebsiteGenerator';
import LiveROIEngine from './landing/components/LiveROIEngine';
import ProofMatrix from './landing/components/ProofMatrix';
import FinalGate from './landing/components/FinalGate';
import { StrategicFAQ, MinimalistFooter } from './landing/components/FAQAndFooter';
import Navbar from './landing/components/Navbar';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
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
      const rawLabel = user?.user_metadata?.owner_name || user?.user_metadata?.restaurant_name || user?.email || 'U';
      setAvatarLabel(String(rawLabel).trim().charAt(0).toUpperCase() || 'U');
    };

    supabase.auth.getUser().then(({ data }) => setUserState(data.user)).catch(() => setUserState(null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUserState(session?.user ?? null));

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 1. SoftwareApplication Schema (For explicit feature & pricing scraping)
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "QuickBiteQR",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "description": "1 Month Free Trial. Custom pricing based on selected services thereafter."
    },
    "featureList": [
      "QR Code Ordering",
      "Kitchen Display System (KDS)",
      "Direct UPI Payments",
      "Live ROI Analytics"
    ]
  };

  // 2. Organization Schema (Knowledge Panel structuring)
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "QuickBiteQR",
    "url": "https://quickbiteqr.co.in",
    "logo": "https://quickbiteqr.co.in/icon-512.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "url": "https://quickbiteqr.co.in",
      "availableLanguage": ["English", "Hindi"]
    }
  };

  // 3. FAQPage Schema (For direct Google snippets and AI summaries)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does it cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your first month is completely free so you and your customers can get used to the platform. After the trial, you only pay for the specific services you choose to purchase. Contact us via the website to learn more about our service packages."
        }
      },
      {
        "@type": "Question",
        "name": "How do UPI payments work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Customers scan your table's QR code and can pay directly to your restaurant's bank account via standard UPI apps like PhonePe, GPay, or Paytm with zero intermediaries."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a setup fee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "There are zero hidden setup fees to get started. You receive a fully functioning 1-month free trial with instant onboarding to explore everything we offer."
        }
      }
    ]
  };

  return (
    <>
      {/* Injecting Structured JSON-LD Data for AEO/SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
        
        <ContactDrawer isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

        <header>
          <Navbar isAuthed={isAuthed} avatarLabel={avatarLabel} onContactClick={() => setIsContactModalOpen(true)} />
        </header>

        {/* Strict Semantic HTML5 DOM */}
        <main>
          <section id="hero" aria-label="Hero Section">
            <HeroSection />
          </section>

          <section id="features" aria-label="How QuickbiteQR Works">
            <HowItWorks />
          </section>

          <section id="playground" aria-label="Free Restaurant Website Generator">
            <FreeWebsiteGenerator />
          </section>

          <section id="audit" aria-label="Live ROI Analytics">
            <LiveROIEngine />
          </section>

          <section id="reviews" aria-label="Customer Reviews">
            <ProofMatrix />
          </section>

          <section id="final-gate" aria-label="Signup Call to Action">
            <FinalGate />
          </section>
        </main>

        <footer>
          <StrategicFAQ />
          <MinimalistFooter />
        </footer>
      </div>
    </>
  );
}