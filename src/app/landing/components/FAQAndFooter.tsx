'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Linkedin, Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';

const FAQS = [
  {
    q: "Do my customers need to download an app?",
    a: "Absolutely not. Diners simply open their phone's native camera, scan the QR code, and your menu instantly opens in their browser. Zero friction."
  },
  {
    q: "Do I need to buy expensive tablets or hardware?",
    a: "No. Your staff can manage everything from the Android or iOS smartphones they already own. You can view the kitchen dashboard on any old laptop or tablet you have lying around."
  },
  {
    q: "What if my restaurant has slow internet?",
    a: "We engineered QuickBiteQR specifically for Tier 3 network conditions. Our digital menus are incredibly lightweight, loading lightning-fast even on 3G connections."
  },
  {
    q: "Do you take a percentage of my sales?",
    a: "Never. We charge a flat, predictable monthly subscription. Your diners pay you directly (via Cash or your own UPI), meaning you get your money instantly with 0% gateway commissions."
  }
];

export function StrategicFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-extrabold tracking-tighter text-4xl md:text-5xl text-slate-900 text-center mb-16">
          Clear Answers for Smart Owners.
        </h2>
        
        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border-b border-slate-200">
                <button 
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between py-6 text-left group outline-none focus:ring-2 focus:ring-[#6DBE45]/50 rounded-lg px-2"
                >
                  <span className="font-serif text-xl font-bold text-slate-800 group-hover:text-[#6DBE45] transition-colors pr-6">
                    {faq.q}
                  </span>
                  <motion.span 
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-3xl text-[#6DBE45] font-light flex-shrink-0 leading-none"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="font-sans text-slate-500 text-base leading-relaxed pb-8 pt-2 pr-12 pl-2">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MinimalistFooter() {
  return (
    <footer className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        
        {/* Brand Section */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
           <div className="font-extrabold text-2xl tracking-tighter text-slate-900 flex items-center gap-1">
             QuickBite<span className="text-[#6DBE45]">QR</span>
           </div>
           <p className="text-slate-500 text-sm font-medium">The operating system for modern restaurants.</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link href="#hero" className="text-sm font-semibold text-slate-600 hover:text-[#6DBE45] transition-colors">Home</Link>
          <Link href="#features" className="text-sm font-semibold text-slate-600 hover:text-[#6DBE45] transition-colors">Features</Link>
          <Link href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-[#6DBE45] transition-colors">Pricing</Link>
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-[#6DBE45] transition-colors">Login</Link>
          <Link href="/contact" className="text-sm font-semibold text-slate-600 hover:text-[#6DBE45] transition-colors">Contact Us</Link>
        </div>

        {/* Socials & Copyright */}
        <div className="flex flex-col items-center md:items-end gap-5">
          <div className="flex items-center gap-6">
             <Link href="https://linkedin.com/company/quickbiteqr" target="_blank" className="text-slate-400 hover:text-[#6DBE45] transition-colors" aria-label="QuickBiteQR on LinkedIn">
               <Linkedin size={20} />
             </Link>
             <Link href="https://www.instagram.com/quickbite_qr" target="_blank" className="text-slate-400 hover:text-[#6DBE45] transition-colors" aria-label="QuickBiteQR on Instagram">
               <Instagram size={20} />
             </Link>
             <Link href="https://www.youtube.com/@quickbiteqr" target="_blank" className="text-slate-400 hover:text-[#6DBE45] transition-colors" aria-label="QuickBiteQR on YouTube">
               <Youtube size={20} />
             </Link>
          </div>
          <div className="text-slate-400 text-sm">
             © 2026 QuickBiteQR. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
