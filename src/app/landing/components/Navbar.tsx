'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, UserCircle2 } from 'lucide-react';

interface NavbarProps {
  isAuthed: boolean;
  avatarLabel: string;
  onContactClick: () => void;
}

export default function Navbar({ isAuthed, avatarLabel, onContactClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ensure scroll is restored when mobile menu closes
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    if (href.startsWith('#')) {
      const targetElement = document.querySelector(href);
      if (targetElement) {
        const offset = 100; // Account for the sticky navbar height
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      window.location.href = href;
    }

    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const NAV_LINKS = [
    { label: "Features", href: "#features", type: "link" },
    { label: "Playground", href: "#playground", type: "link" },
    { label: "ROI Audit", href: "#audit", type: "link" },
    { label: "Wall of Love", href: "#reviews", type: "link" },
    { label: "FAQ", href: "#faq", type: "link" },
    { label: 'Contact', onClick: onContactClick, type: 'button' },
  ];

  return (
    <>
      {/* Desktop & Sticky Nav Container */}
      <motion.nav
        initial={false}
        animate={{
          y: scrolled ? 16 : 0, // top-4 equivalent
          width: scrolled ? 'calc(100% - 32px)' : '100%',
          maxWidth: scrolled ? '1024px' : '1280px', // max-w-5xl vs max-w-7xl
          borderRadius: scrolled ? '9999px' : '0px',
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0)',
          borderColor: scrolled ? 'rgba(226, 232, 240, 0.5)' : 'rgba(255, 255, 255, 0)',
          boxShadow: scrolled ? '0 8px 30px rgba(0,0,0,0.04)' : 'none',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 mx-auto z-50 flex items-center justify-between px-6 py-4 border backdrop-blur-xl"
        style={{
          // For initial SSR render before JS hydration, we use neutral styling that motion will override
          maxWidth: '1280px',
        }}
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-1 z-50">
          <Image
            src="/quickbitelogo.png"
            alt="QuickBiteQR logo"
            width={160}
            height={40}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        {/* Center: Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            link.type === 'link' ? (
              <a
                key={link.label}
                href={link.href!}
                onClick={(e) => handleNavClick(e, link.href!)}
                className="group relative text-sm font-semibold text-slate-600 transition-colors hover:text-[#6DBE45]"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-[#6DBE45] transition-all group-hover:w-full rounded-full"></span>
              </a>
            ) : (
              <button
                key={link.label}
                onClick={link.onClick}
                className="group relative text-sm font-semibold text-slate-600 transition-colors hover:text-[#6DBE45]"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-[#6DBE45] transition-all group-hover:w-full rounded-full"></span>
              </button>
            )
          ))}
        </div>

        {/* Right: Auth / CTA (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 z-50">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200 hover:ring-[#6DBE45]/40 transition-colors"
            >
              <UserCircle2 className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Account</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[#6DBE45] px-2 transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold bg-[#6DBE45] text-slate-900 px-6 py-2.5 rounded-full hover:bg-[#5aa337] transition-all hover:scale-105 shadow-[0_0_15px_rgba(109,190,69,0.3)]"
              >
                Start Free Trial
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden z-50 p-2 text-slate-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      {/* Mobile Menu Fullscreen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center pt-20 pb-8 px-6"
          >
            <div className="flex flex-col items-center gap-8 w-full max-w-sm">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  {link.type === 'link' ? (
                    <a
                      href={link.href!}
                      onClick={(e) => handleNavClick(e, link.href!)}
                      className="text-2xl font-bold text-slate-800 hover:text-[#6DBE45] transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        link.onClick?.();
                        setMobileMenuOpen(false);
                      }}
                      className="text-2xl font-bold text-slate-800 hover:text-[#6DBE45] transition-colors"
                    >
                      {link.label}
                    </button>
                  )}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: NAV_LINKS.length * 0.05, duration: 0.3 }}
                className="w-full flex flex-col gap-4 mt-8 pt-8 border-t border-slate-200/50"
              >
                {isAuthed ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-4 shadow-sm text-slate-800 font-bold text-lg hover:bg-slate-200 transition-colors"
                  >
                    <UserCircle2 className="h-6 w-6" />
                    Account
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-bold text-slate-600 text-center py-2 hover:text-[#6DBE45]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-black bg-[#6DBE45] text-slate-900 px-8 py-4 rounded-full text-center shadow-[0_0_15px_rgba(109,190,69,0.3)] active:scale-95 transition-transform"
                    >
                      Start Free Trial
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
