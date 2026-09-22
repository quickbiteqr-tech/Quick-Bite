'use client';
import { useState, useEffect } from 'react';
import { useSpring, motion } from 'framer-motion';

// --- Animated Number Component ---
function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '', 
  className = '', 
  decimals = 0 
}: { 
  value: number, 
  prefix?: string, 
  suffix?: string, 
  className?: string, 
  decimals?: number 
}) {
  const [display, setDisplay] = useState(prefix + (decimals === 0 ? Math.round(value).toLocaleString() : value.toFixed(decimals)) + suffix);
  // Snappy, physical spin
  const spring = useSpring(value, { bounce: 0, duration: 400 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (decimals === 0) {
         setDisplay(prefix + Math.round(latest).toLocaleString() + suffix);
      } else {
         setDisplay(prefix + latest.toFixed(decimals) + suffix);
      }
    });
    return unsubscribe;
  }, [spring, prefix, suffix, decimals]);

  return <span className={className}>{display}</span>;
}

// --- Custom Slider Component ---
function CustomSlider({ 
  label, 
  subtext,
  value, 
  min, 
  max, 
  step, 
  onChange,
  prefix = '',
  suffix = ''
}: { 
  label: string, 
  subtext?: string,
  value: number, 
  min: number, 
  max: number, 
  step: number, 
  onChange: (val: number) => void,
  prefix?: string,
  suffix?: string
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
           <label className="text-slate-200 font-sans font-semibold text-sm tracking-wide">{label}</label>
           {subtext && <span className="text-slate-500 font-sans text-xs mt-1 max-w-[250px] leading-relaxed">{subtext}</span>}
        </div>
        <div className="text-white font-sans font-bold bg-white/10 px-3 py-1.5 rounded-md text-sm border border-white/10 shadow-inner">
          {prefix}{value.toLocaleString()}{suffix}
        </div>
      </div>
      <div className="relative w-full h-2 rounded-full bg-white/5 mt-2 overflow-visible">
        <div className="absolute top-0 left-0 h-full bg-[#6DBE45] rounded-full pointer-events-none" style={{ width: `${percentage}%` }}></div>
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="absolute top-1/2 -mt-2.5 -ml-2.5 w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(109,190,69,0.6)] pointer-events-none border-2 border-white/20 transition-transform hover:scale-110" style={{ left: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

export default function LiveROIEngine() {
  const [dailyOrders, setDailyOrders] = useState(150);
  const [aov, setAov] = useState(500);
  const [skepticism, setSkepticism] = useState(15);

  // Parallax State
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max rotation 8 degrees
    const rotX = -((y - centerY) / centerY) * 8; 
    const rotY = ((x - centerX) / centerX) * 8;
    
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // --- The Mathematical Audit ---
  
  // Wasted Waiter Time: Daily Orders * 4 mins / 60 mins * 30 days = Monthly Hours
  const wastedHours = (dailyOrders * 4 * 30) / 60;
  
  // Sent-back food error costs: assuming ₹3 average loss per order error across all orders? 
  // Let's use the literal math requested: Daily Orders * 3 * 30 days = monthly error cost
  const monthlyErrorCost = dailyOrders * 3 * 30;

  // Visual Upsell Revenue
  const upsellRevenue = (dailyOrders * aov * 30) * (skepticism / 100);

  // The Grand Total Recovered
  // Assuming 150 INR per hour for labor monetization
  const grandTotal = (wastedHours * 150) + monthlyErrorCost + upsellRevenue;

  return (
    <section className="relative w-full bg-[#050505] py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Subtle Noise / Glow */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6DBE45]/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Headings */}
        <div className="text-center mb-16 md:mb-24">
          <p className="text-[#6DBE45] text-sm font-sans font-bold tracking-widest uppercase mb-4">Profit Leak Audit</p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif tracking-tighter text-white mb-6 text-balance max-w-4xl mx-auto">
            We Don't Promise Magic. <br className="hidden md:block"/>
            We Just <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#6DBE45]">Plug The Leaks.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed font-sans max-w-2xl mx-auto">
            Restaurant margins are notoriously tight. Adjust your current numbers below to see exactly how much capital you are bleeding to human error and inefficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* LEFT: The Skepticism Controls */}
          <div className="bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[2rem] relative font-sans">
            <div className="space-y-12">
              <CustomSlider 
                label="Daily Orders" 
                value={dailyOrders} 
                min={10} 
                max={500} 
                step={1} 
                onChange={setDailyOrders} 
              />
              <CustomSlider 
                label="Avg Order Value (AOV)" 
                value={aov} 
                min={100} 
                max={2000} 
                step={50} 
                onChange={setAov} 
                prefix="₹" 
              />
              <CustomSlider 
                label="Skepticism Dial (Upsell %)" 
                subtext="Don't believe digital menus increase sales by 20%? Drag this down to a conservative 5% and watch the math."
                value={skepticism} 
                min={2} 
                max={25} 
                step={1} 
                onChange={setSkepticism} 
                suffix="%" 
              />
            </div>
          </div>

          {/* RIGHT: The Glass Receipt (Wow Factor) */}
          <div 
             className="relative perspective-[1000px] w-full"
             onMouseMove={handleMouseMove}
             onMouseLeave={handleMouseLeave}
          >
             <motion.div 
               animate={{ rotateX, rotateY }}
               transition={{ type: "spring", stiffness: 100, damping: 20 }}
               className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-t-xl rounded-b-[2rem] p-8 md:p-10 font-mono text-slate-300 flex flex-col gap-8 relative overflow-hidden"
             >
                {/* Top Badge */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                   <div className="w-2 h-2 bg-[#6DBE45] rounded-full animate-pulse shadow-[0_0_10px_#6DBE45]"></div>
                   <span className="text-[10px] text-white/70 uppercase tracking-widest font-sans font-bold">0% Payment Commissions</span>
                </div>

                <div className="text-xs text-slate-500 uppercase tracking-widest border-b border-white/10 pb-4 mt-2">Operational Audit</div>

                {/* Section 1: The Leaks (Red) */}
                <div className="flex flex-col gap-4">
                   <div className="text-white/60 font-bold uppercase tracking-wider text-xs">Identified Monthly Leaks</div>
                   <div className="flex flex-col gap-5 pl-3 border-l border-red-500/30 text-sm">
                      <div className="flex flex-col gap-1">
                         <div className="text-red-400/80 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span>-</span>
                            <span><AnimatedNumber value={wastedHours} decimals={0} /> hrs / mo</span>
                            <span className="text-red-400/50 text-xs sm:text-sm font-sans">(Wasted Floor Time)</span>
                         </div>
                         <div className="text-[11px] text-slate-500 leading-snug mt-1 border-l border-white/10 pl-2 font-sans">
                            Waiters make 4 trips per table (menu, order, food, bill). QR ordering cuts this in half. The built-in Waiter Call Button ensures staff only walk over when actually needed.
                         </div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="text-red-400/80 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span>-</span>
                            <span>₹<AnimatedNumber value={monthlyErrorCost} /> / mo</span>
                            <span className="text-red-400/50 text-xs sm:text-sm font-sans">(Sent-back food)</span>
                         </div>
                         <div className="text-[11px] text-slate-500 leading-snug mt-1 border-l border-white/10 pl-2 font-sans">
                            Misheard orders and forgotten modifiers cost you money. When diners send orders directly to the kitchen, communication errors drop to zero.
                         </div>
                      </div>
                   </div>
                </div>

                {/* Section 2: Recovered (Green) */}
                <div className="flex flex-col gap-4 mt-2">
                   <div className="text-white/60 font-bold uppercase tracking-wider text-xs">Recovered Capital</div>
                   <div className="flex flex-col gap-3 pl-3 border-l border-[#6DBE45]/30 text-sm">
                      <div className="flex flex-col gap-1">
                         <div className="text-[#6DBE45] flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span>+</span>
                            <span>₹<AnimatedNumber value={upsellRevenue} /> / mo</span>
                            <span className="text-[#6DBE45]/50 text-xs sm:text-sm font-sans">(Impulse Buys)</span>
                         </div>
                         <div className="text-[11px] text-slate-500 leading-snug mt-1 border-l border-[#6DBE45]/20 pl-2 font-sans">
                            Frictionless ordering means diners don't wait 10 mins to catch a waiter's eye for a 2nd drink or dessert. They just tap, order, and increase your AOV.
                         </div>
                      </div>
                   </div>
                </div>

                {/* The Grand Total */}
                <div className="mt-6 pt-6 relative">
                   <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#6DBE45] to-transparent"></div>
                   
                   <div className="text-xs text-slate-400 uppercase tracking-widest mb-4 font-sans font-bold">Monthly Capital Recovered:</div>
                   
                   <div className="text-5xl md:text-6xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#6DBE45] drop-shadow-[0_0_30px_rgba(109,190,69,0.3)] pb-2 -ml-1 flex items-baseline">
                     ₹<AnimatedNumber value={grandTotal} />
                   </div>
                   
                   <div className="text-[10px] text-slate-600 mt-4 font-sans">
                      *Includes labor monetization at standard hospitality rates.
                   </div>
                </div>
                
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
