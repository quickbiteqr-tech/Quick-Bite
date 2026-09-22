import { motion } from 'framer-motion';

export default function CtaTile() {
  const WHATSAPP_NUMBER = '917099239475';
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi QuickBiteQR, I want to know more about your platform.')}`;
  
  return (
    <motion.a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="relative flex flex-col items-center justify-center p-6 lg:p-8 overflow-hidden min-h-0 h-full bg-[#0a0a0a] border-t border-white/20 rounded-[2rem] lg:col-span-1 lg:row-span-1 group shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer"
    >
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-15 mix-blend-screen pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>
      
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none"></div>

      {/* NFC Rings & Icon */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-8 shrink-0">
        {/* Ring 1 (Outer) */}
        <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-[#6DBE45]/40 group-hover:scale-125 group-hover:bg-[#6DBE45]/10 transition-all duration-[800ms] ease-out"></div>
        {/* Ring 2 (Middle) */}
        <div className="absolute inset-3 rounded-full border border-white/15 group-hover:border-[#6DBE45]/60 group-hover:scale-110 group-hover:bg-[#6DBE45]/20 transition-all duration-[600ms] ease-out delay-75"></div>
        {/* Ring 3 (Inner) */}
        <div className="absolute inset-6 rounded-full border border-white/20 group-hover:border-[#6DBE45] group-hover:scale-105 group-hover:bg-[#6DBE45]/30 transition-all duration-[400ms] ease-out delay-150 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"></div>
        
        {/* The NFC Node Center */}
        <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group-hover:ring-[#6DBE45] transition-all duration-300">
          <svg 
            className="w-6 h-6 text-white/50 group-hover:text-white transition-colors duration-300 transform -rotate-90" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M4.5 16.5c2-2.5 5.5-2.5 7.5 0"></path>
            <path d="M2.5 13.5c3.5-4 8.5-4 11.5 0"></path>
            <path d="M.5 10.5c5-5.5 12-5.5 15.5 0"></path>
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="relative z-10 text-center shrink-0">
        <h3 className="text-xl font-bold tracking-tight text-slate-400 group-hover:text-white group-hover:text-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 mb-1">
          Tap to Connect
        </h3>
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          SKIP THE WAITLIST
        </p>
      </div>
    </motion.a>
  );
}