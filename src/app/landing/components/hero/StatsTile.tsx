import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function StatsTile() {
  const [clipPath, setClipPath] = useState('');

  useEffect(() => {
    // Generate a dynamic zig-zag clip path for the receipt bottom
    const numTeeth = 30;
    const teeth = Array.from({ length: numTeeth + 1 }).map((_, i) => {
      const x = (i / numTeeth) * 100;
      const y = i % 2 === 0 ? 'calc(100% - 8px)' : '100%';
      return `${x}% ${y}`;
    }).reverse().join(', '); // Reverse for bottom edge right-to-left
    
    setClipPath(`polygon(0% 0%, 100% 0%, 100% calc(100% - 8px), ${teeth}, 0% calc(100% - 8px))`);
  }, []);

  const orders = [
    { id: '8092', item: '2x Smash Burger', lat: '0.4s' },
    { id: '8093', item: '1x Truffle Fries', lat: '0.3s' },
    { id: '8094', item: '3x Diet Cola', lat: '0.4s' },
    { id: '8095', item: '1x Vegan Wrap', lat: '0.5s' },
    { id: '8096', item: '2x Milkshake', lat: '0.3s' },
    { id: '8097', item: '1x Onion Rings', lat: '0.4s' },
  ];

  // Duplicate for seamless infinite loop
  const scrollItems = [...orders, ...orders];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative flex flex-col items-center justify-start h-full min-h-0 bg-slate-800 rounded-[2rem] lg:col-span-1 lg:row-span-1 overflow-hidden shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
    >
      {/* The Printer Slot (Dark depth) */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/90 to-transparent z-20 pointer-events-none rounded-t-[2rem]"></div>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-black/80 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,1)] z-30"></div>

      {/* The White Receipt Paper */}
      <div 
        className="relative w-[85%] h-[95%] bg-[#f8f9fa] mt-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pt-6 pb-8 flex flex-col font-mono text-slate-800"
        style={{ clipPath: clipPath || 'none' }}
      >
        {/* Main Metric Header */}
        <div className="px-5 pb-4 border-b-2 border-dashed border-slate-300 shrink-0 text-center relative z-10 bg-[#f8f9fa]">
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 mb-1 font-bold">AVG LATENCY</div>
          <div className="text-4xl font-black tracking-tighter text-slate-900 leading-none">0.4s</div>
        </div>

        {/* Live Feed Container (Masked) */}
        <div className="relative flex-1 overflow-hidden mask-image-bottom-fade mt-2">
          {/* Fading top and bottom pure CSS mask for the scrolling text */}
          <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(to bottom, #f8f9fa 0%, transparent 15%, transparent 80%, #f8f9fa 100%)' }}></div>
          
          <motion.div 
            className="flex flex-col gap-3 px-4 pt-4 text-xs font-medium"
            animate={{ y: ['0%', '-50%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            {scrollItems.map((order, idx) => (
              <div key={idx} className="flex items-center justify-between opacity-80 mix-blend-multiply">
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400">#{order.id}</span>
                  <span className="truncate max-w-[100px] text-slate-700">{order.item}</span>
                </div>
                <span className="font-bold text-slate-900">{order.lat}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}