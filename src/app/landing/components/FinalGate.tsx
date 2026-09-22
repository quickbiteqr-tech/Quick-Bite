'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function FinalGate() {
  return (
    <section className="w-full bg-slate-50 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-4">
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto bg-[#050505] rounded-[2rem] md:rounded-[3rem] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
      >
        {/* Spotlight Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(109,190,69,0.3)_0%,transparent_70%)] pointer-events-none mix-blend-screen"></div>
        
        {/* Subtle CSS Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30"></div>

        {/* Abstract Glowing Rings (Depth) */}
        {/* Bottom Left */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 border-2 border-[#6DBE45]/20 rounded-full opacity-40 blur-[2px] pointer-events-none"></div>
        <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] border border-[#6DBE45]/10 rounded-full opacity-30 blur-[4px] pointer-events-none"></div>
        
        {/* Top Right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 border-2 border-[#6DBE45]/20 rounded-full opacity-40 blur-[2px] pointer-events-none"></div>
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] border border-[#6DBE45]/10 rounded-full opacity-30 blur-[4px] pointer-events-none"></div>

        <div className="relative z-10 py-24 md:py-32 px-6 flex flex-col items-center justify-center text-center">
          
          {/* Badge */}
          <div className="text-[#6DBE45] bg-[#6DBE45]/10 border border-[#6DBE45]/20 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 shadow-[0_0_15px_rgba(109,190,69,0.2)] flex items-center justify-center">
            <span className="animate-pulse mr-2 w-2 h-2 bg-[#6DBE45] rounded-full"></span>
            Zero-Friction Onboarding
          </div>
          
          {/* Headline */}
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tighter text-white max-w-4xl text-balance leading-[1.1]">
            Stop the Bleeding. <br /> Let's Fix Your Floor By Dinner Service.
          </h2>
          
          {/* Subtext */}
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mt-6 leading-relaxed font-sans">
            Join 5,000+ smart kitchens. Create your account, upload your menu, and start taking digital orders in the next 5 minutes.
          </p>
          
          {/* Action Center */}
          <Link href="/signup" className="group mt-10">
            <button className="bg-[#6DBE45] text-slate-900 font-black tracking-wide text-lg md:text-xl px-10 py-5 rounded-full group-hover:scale-105 group-hover:bg-emerald-400 transition-all duration-300 shadow-[0_0_40px_rgba(109,190,69,0.4)] flex items-center justify-center gap-2">
              Start Your Free Trial 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </Link>
          
          {/* Trust Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4 mt-8 font-sans">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
              <Check size={18} className="text-[#6DBE45]" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
              <Check size={18} className="text-[#6DBE45]" />
              Live in 5 minutes
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
              <Check size={18} className="text-[#6DBE45]" />
              0% payment commissions
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
