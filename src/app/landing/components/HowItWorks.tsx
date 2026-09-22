'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: (
      <>
        1. Never Print Another <span className="text-[#6DBE45]">Paper Menu.</span>
      </>
    ),
    desc: "Stop wasting money on printing. Skip the tedious typing by picking from our visual library. If a dish runs out, hide it instantly. If ingredient costs go up, update your prices on the fly to protect your margins.",
  },
  {
    title: (
      <>
        2. Turn Every Table Into Its <span className="text-[#6DBE45]">Own Server.</span>
      </>
    ),
    desc: "We auto-generate unique QR codes mapped to your floor plan. Diners sit, scan, and browse immediately—no app needed. You capture orders faster while your staff spends less time running back and forth with notepads.",
  },
  {
    title: (
      <>
        3. End Kitchen Chaos & <span className="text-[#6DBE45]">Order Mistakes.</span>
      </>
    ),
    desc: "Orders flow directly from the diner's phone to your kitchen screen with zero miscommunication. Send a live prep time back to the diner's phone so they relax, and your staff stops answering 'where is my food?'",
  }
];

export default function HowItWorks() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <section className="relative w-full bg-[#0a0a0a] text-white pb-32">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(109,190,69,0.05),transparent_70%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="pt-24 md:pt-32 pb-12 text-center md:text-left relative z-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-4 max-w-2xl">
            Wait, what exactly is QuickBite<span className="text-[#6DBE45]">QR</span>?
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row relative">
          
          {/* MOBILE: Sticky Viewing Window */}
          <div className="lg:hidden sticky top-20 h-[50vh] w-full z-10 py-4">
            <ViewingWindow activeSection={activeSection} />
          </div>

          {/* LEFT COLUMN: Scrolling Text Blocks */}
          <div className="w-full lg:w-1/2 relative z-0 pb-[10vh] lg:pb-[30vh]">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                onViewportEnter={() => setActiveSection(index)}
                viewport={{ amount: 0.5, margin: "-20% 0px -20% 0px" }}
                className={`flex flex-col justify-center min-h-[50vh] lg:min-h-[80vh] py-12 lg:pr-16 transition-all duration-500 ${activeSection === index ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}
              >
                <h3 className={`text-3xl lg:text-4xl font-extrabold tracking-tighter mb-6 leading-tight transition-colors duration-500 ${activeSection === index ? 'text-white' : 'text-slate-500'}`}>{step.title}</h3>
                <p className={`text-lg lg:text-xl leading-relaxed max-w-md transition-colors duration-500 ${activeSection === index ? 'text-slate-300' : 'text-slate-500'}`}>{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* DESKTOP: Sticky Viewing Window */}
          <div className="hidden lg:block sticky top-0 h-screen w-1/2 right-0">
            <div className="flex items-center justify-center w-full h-full py-24 pl-12 pr-4">
              <ViewingWindow activeSection={activeSection} />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

const ViewingWindow = ({ activeSection }: { activeSection: number }) => {
  return (
    <div className="w-full h-full max-h-[600px] bg-white/5 border border-white/10 rounded-[2rem] p-4 md:p-8 relative overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(109,190,69,0.08)] backdrop-blur-md">
      <AnimatePresence mode="wait">
        {activeSection === 0 && (
          <motion.div key="step1" variants={fadeVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }} className="w-full flex justify-center">
            <Step1UI />
          </motion.div>
        )}
        {activeSection === 1 && (
          <motion.div key="step2" variants={fadeVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }} className="w-full flex justify-center">
            <Step2UI />
          </motion.div>
        )}
        {activeSection === 2 && (
          <motion.div key="step3" variants={fadeVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }} className="w-full flex justify-center">
            <Step3UI />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const fadeVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/* --- MICRO UIs --- */

const Step1UI = () => (
  <div className="grid grid-cols-2 gap-3 md:gap-4 relative w-full max-w-[340px]">
    <motion.div className="bg-[#1a1a1a] border border-[#6DBE45]/30 rounded-2xl p-4 relative overflow-hidden h-36 md:h-44 shadow-[0_0_20px_rgba(109,190,69,0.1)]">
      <div className="w-10 h-10 rounded-xl bg-[#6DBE45]/20 border border-[#6DBE45]/30 mb-3 flex items-center justify-center">
         <div className="w-4 h-4 rounded-sm bg-[#6DBE45]/80"></div>
      </div>
      <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2"></div>
      <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
      
      <motion.div 
        className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col justify-end p-3"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex justify-between items-center bg-white/10 rounded-xl p-2.5 border border-white/5 shadow-inner">
          <span className="text-sm text-white font-mono font-bold tracking-tight">₹150</span>
          <div className="w-8 h-5 rounded-full p-0.5 relative overflow-hidden bg-white/10 border border-white/5">
            <motion.div 
              className="absolute inset-0 bg-[#6DBE45]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            ></motion.div>
            <motion.div 
              className="w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)] relative z-10"
              initial={{ x: 0 }}
              animate={{ x: 12 }}
              transition={{ delay: 0.8, duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
            ></motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>

    <div className="bg-[#111] border border-white/5 rounded-2xl p-4 opacity-40 h-36 md:h-44">
      <div className="w-10 h-10 rounded-xl bg-slate-800 mb-3"></div>
      <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2"></div>
    </div>
    <div className="bg-[#111] border border-white/5 rounded-2xl p-4 opacity-40 h-36 md:h-44">
      <div className="w-10 h-10 rounded-xl bg-slate-800 mb-3"></div>
      <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2"></div>
    </div>
    <div className="bg-[#111] border border-white/5 rounded-2xl p-4 opacity-40 h-36 md:h-44">
      <div className="w-10 h-10 rounded-xl bg-slate-800 mb-3"></div>
      <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2"></div>
    </div>
  </div>
);

const Step2UI = () => (
  <div className="w-full max-w-[280px] bg-[#111] border border-white/5 rounded-[2rem] p-6 flex flex-col items-center relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
    <div className="text-white/60 font-mono text-sm tracking-widest mb-5">TABLE 12</div>
    <div className="w-32 h-32 bg-white rounded-xl p-2 relative overflow-hidden z-10 mb-6 shadow-2xl">
      <motion.div
        className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTExMTEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMSIvPjxyZWN0IHg9IjE0IiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMSIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEiLz48cmVjdCB4PSIzIiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEiLz48L3N2Zz4=')] bg-cover opacity-90"
        initial={{ y: "-100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      ></motion.div>
    </div>
    <div className="w-full flex flex-col gap-3">
      <motion.button 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:border-[#6DBE45]/50 hover:text-white transition-colors tracking-wide"
      >
        Download PDF
      </motion.button>
      <motion.button 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full py-3 bg-white/10 border border-[#6DBE45]/30 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(109,190,69,0.1)] relative overflow-hidden hover:shadow-[0_0_25px_rgba(109,190,69,0.3)] transition-shadow"
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(109,190,69,0.3)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]"></div>
        <span className="relative z-10">Order Acrylic Stand</span>
      </motion.button>
    </div>
  </div>
);

const Step3UI = () => (
  <div className="flex items-center justify-between gap-4 md:gap-8 relative w-full max-w-[420px]">
    {/* Kitchen Dashboard */}
    <div className="w-36 md:w-44 h-48 bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col relative z-20 shadow-2xl">
      <div className="text-[9px] md:text-[10px] text-white/50 mb-3 font-mono tracking-widest">KITCHEN SYNC</div>
      
      <motion.div 
        className="w-full bg-[#1a1a1a] border border-[#6DBE45]/30 rounded-lg p-2.5 mb-2 shadow-inner"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="w-1/2 h-1.5 bg-[#6DBE45]/50 rounded-full mb-2"></div>
        <div className="w-full h-1.5 bg-slate-600 rounded-full mb-1.5"></div>
        <div className="w-3/4 h-1.5 bg-slate-600 rounded-full"></div>
      </motion.div>
      
      <motion.div 
        className="mt-auto self-start bg-white/5 border border-white/10 rounded-full px-2.5 py-1.5 flex items-center gap-2 relative cursor-pointer"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 0.9, 1], backgroundColor: ["rgba(255,255,255,0.05)", "rgba(109,190,69,0.3)", "rgba(255,255,255,0.05)"], borderColor: ["rgba(255,255,255,0.1)", "rgba(109,190,69,0.5)", "rgba(255,255,255,0.1)"] }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#6DBE45] shadow-[0_0_5px_#6DBE45]"></div>
        <span className="text-[10px] font-bold text-white/90">Set ETA: 15m</span>
        
        {/* Cursor */}
        <motion.div 
          className="absolute -right-4 -bottom-4 w-5 h-5 z-30"
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], x: [20, 0, 0, 20], y: [20, 0, 0, 20] }}
          transition={{ duration: 1.5, delay: 0.3, times: [0, 0.3, 0.7, 1] }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" fill="currentColor"/>
          </svg>
        </motion.div>
      </motion.div>
    </div>
    
    {/* Pulse Line */}
    <div className="absolute left-[8.5rem] md:left-[10.5rem] right-[5.5rem] md:right-[6.5rem] h-[2px] bg-white/5 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
      <motion.div 
        className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-transparent via-[#6DBE45] to-transparent shadow-[0_0_15px_#6DBE45]"
        initial={{ x: -60 }}
        animate={{ x: 200 }}
        transition={{ duration: 0.5, delay: 1 }}
      ></motion.div>
    </div>

    {/* Diner Phone */}
    <div className="w-20 md:w-24 h-40 md:h-44 bg-[#0a0a0a] border-[4px] border-slate-800 rounded-[1.5rem] relative flex flex-col items-center justify-center overflow-hidden z-20 shrink-0">
      <div className="absolute top-1.5 w-6 md:w-8 h-1 md:h-1.5 bg-slate-800 rounded-full"></div>
      
      <motion.div 
        className="w-10 md:w-12 h-10 md:h-12 rounded-full border-2 border-white/10 flex items-center justify-center relative mt-3"
        initial={{ borderColor: "rgba(255,255,255,0.1)" }}
        animate={{ borderColor: "rgba(109,190,69,0.6)" }}
        transition={{ duration: 0.3, delay: 1.4 }}
      >
        <motion.div 
          className="absolute inset-0 rounded-full bg-[#6DBE45]/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, delay: 1.4, repeat: Infinity, repeatDelay: 1 }}
        ></motion.div>
        
        <motion.svg 
          className="w-4 h-4 md:w-5 md:h-5 text-white/30"
          initial={{ color: "rgba(255,255,255,0.3)" }}
          animate={{ color: "#6DBE45" }}
          transition={{ duration: 0.3, delay: 1.4 }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </motion.svg>
      </motion.div>
      
      <motion.div 
        className="text-[8px] md:text-[9px] font-bold text-slate-500 mt-4 text-center px-1 leading-tight"
        initial={{ opacity: 1 }}
      >
        <motion.span 
          initial={{ display: "block" }}
          animate={{ display: "none" }}
          transition={{ delay: 1.4 }}
        >
          Order Placed
        </motion.span>
        <motion.span 
          className="text-[#6DBE45]"
          initial={{ display: "none" }}
          animate={{ display: "block" }}
          transition={{ delay: 1.4 }}
        >
          Ready in 15 mins
        </motion.span>
      </motion.div>
    </div>
  </div>
);
