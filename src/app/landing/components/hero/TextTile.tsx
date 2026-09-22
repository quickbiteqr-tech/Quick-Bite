'use client';
import { motion } from 'framer-motion';

export default function TextTile() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col justify-center h-full min-h-0 p-6 md:p-8 lg:p-12 bg-white/70 backdrop-blur-2xl ring-1 ring-slate-900/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] lg:col-span-2 lg:row-span-1 overflow-hidden"
    >

      {/* Outcome-Driven Headline */}
      <h1 className="text-[clamp(2.2rem,4.5vw,4.5rem)] leading-[0.95] text-slate-900 tracking-tighter font-extrabold mb-5 shrink-0">
        SCALE REVENUE. <br />
        NOT YOUR <br />
        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 bg-[length:200%_auto] animate-[shine_3s_linear_infinite]">
          PAYROLL.
        </span>
      </h1>
      
      {/* Full-width, high-impact copy spanning 1-2 lines */}
      <p className="w-full max-w-none text-base md:text-lg leading-relaxed text-slate-500 font-medium font-sans shrink-1 text-pretty">
        Stop losing peak-hour orders to slow service and chaos. Turn every table into its own server so you can flip tables faster, slash wait times, and keep 100% of your margins.
      </p>
    </motion.div>
  );
}