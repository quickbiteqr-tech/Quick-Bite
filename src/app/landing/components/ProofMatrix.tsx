'use client';
import { Star, CheckCircle2 } from 'lucide-react';

const CASE_STUDIES = [
  {
    badge: "0 Print Costs",
    rating: "4.9",
    quote1: "We used to spend ₹5k a month reprinting menus.",
    quote2: "Now, when tomato prices surge, I update our prices in 3 seconds from my phone. It’s a lifesaver.",
    name: "Rahul D.",
    restaurant: "Spice Junction",
    image: "https://i.pravatar.cc/150?img=11"
  },
  {
    badge: "+18% AOV",
    rating: "4.8",
    quote1: "People buy with their eyes.",
    quote2: "Our average order jumped 18% in week one just because the photos of our milkshakes looked so good on their screens.",
    name: "Priya S.",
    restaurant: "The Daily Grind",
    image: "https://i.pravatar.cc/150?img=5"
  },
  {
    badge: "Zero Chaos",
    rating: "4.7",
    quote1: "Weekends used to be a nightmare for my staff.",
    quote2: "Now diners order directly, the kitchen gets the ticket instantly, and my waiters actually smile.",
    name: "Amit M.",
    restaurant: "Biryani Central",
    image: "https://i.pravatar.cc/150?img=13"
  },
  {
    badge: "Instant Service",
    rating: "4.9",
    quote1: "The waiter call button changed everything.",
    quote2: "Customers aren't frantically waving at us anymore, and we only go to the table when they actually need us.",
    name: "Sneha K.",
    restaurant: "Coastal Bites",
    image: "https://i.pravatar.cc/150?img=19"
  },
  {
    badge: "2x Table Turns",
    rating: "4.8",
    quote1: "No more waiting 15 minutes for the bill.",
    quote2: "Customers order and pay when they want. Our tables turn over twice as fast during the Friday rush.",
    name: "Vikram R.",
    restaurant: "Tandoori Flames",
    image: "https://i.pravatar.cc/150?img=8"
  },
  {
    badge: "Happy Staff",
    rating: "4.9",
    quote1: "I haven't had a waiter quit in six months.",
    quote2: "The system handles the tedious order-taking, so my team focuses purely on hospitality and upselling.",
    name: "Meera T.",
    restaurant: "Café Monsoon",
    image: "https://i.pravatar.cc/150?img=42"
  },
  {
    badge: "High Margin",
    rating: "4.7",
    quote1: "We recovered our entire monthly fee on day two.",
    quote2: "By removing order errors and food waste, our kitchen runs at peak efficiency. The ROI is undeniable.",
    name: "Karan P.",
    restaurant: "The Curry Cartel",
    image: "https://i.pravatar.cc/150?img=15"
  },
  {
    badge: "No Wait Times",
    rating: "4.9",
    quote1: "The lunch rush is finally manageable.",
    quote2: "Corporate crowds don't have to wait to place orders. They scan, eat, and leave happy. It's brilliant.",
    name: "Anjali V.",
    restaurant: "Urban Wok",
    image: "https://i.pravatar.cc/150?img=26"
  }
];

function MicroCaseStudyCard({ t }: { t: typeof CASE_STUDIES[0] }) {
  return (
    <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-[340px] max-w-[380px] mx-3 shrink-0 flex flex-col gap-5 relative z-10">
      {/* Top Row (Metrics & Reality) */}
      <div className="flex justify-between items-center">
        <div className="bg-[#6DBE45]/10 text-[#6DBE45] font-bold text-xs px-3 py-1 rounded-full">
          {t.badge}
        </div>
        <div className="text-slate-700 font-bold text-sm flex items-center gap-1">
          {t.rating} <Star size={14} className="fill-amber-400 text-amber-400" />
        </div>
      </div>
      
      {/* The Quote */}
      <p className="font-sans text-slate-600 leading-relaxed text-sm flex-1">
        <span className="font-semibold text-slate-800">{t.quote1}</span> {t.quote2}
      </p>

      {/* Footer (Identity) */}
      <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
        <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
        <div className="flex flex-col">
          <div className="font-bold text-slate-900 text-sm">{t.name}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            {t.restaurant}
            <CheckCircle2 size={12} className="text-[#6DBE45]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProofMatrix() {
  // Split 8 distinct studies into two rows
  const row1Data = CASE_STUDIES.slice(0, 4);
  const row2Data = CASE_STUDIES.slice(4, 8);

  // Triplicate the data so the infinite scroll never runs out of track on ultra-wide screens
  const row1 = [...row1Data, ...row1Data, ...row1Data];
  const row2 = [...row2Data, ...row2Data, ...row2Data];

  return (
    <section className="relative py-24 overflow-hidden bg-slate-50 border-y border-slate-200">
      
      {/* Layer 1: The Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Layer 2: The Brand Glow */}
      <div className="absolute w-[800px] h-[400px] bg-[#6DBE45]/[0.07] blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      {/* CSS Keyframes for triplicated continuous scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-33.333333%)); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(calc(-33.333333%)); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 40s linear infinite;
        }
        .pause-on-hover:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10">
        <h2 className="font-extrabold tracking-tighter text-4xl md:text-5xl text-slate-900 text-center max-w-3xl mx-auto text-balance">
          Powering The Next Generation Of <span className="text-[#6DBE45]">Smart Kitchens.</span>
        </h2>
        <p className="text-slate-500 text-lg text-center mt-6 max-w-2xl mx-auto font-medium">
          Join 5,000+ restaurant owners who stopped bleeding margins and took control of their floor.
        </p>
      </div>

      <div 
        className="w-full relative flex flex-col gap-6"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
      >
        {/* Row 1: Scrolls Left */}
        <div className="flex w-fit animate-scroll-left pause-on-hover">
          {row1.map((t, i) => (
            <MicroCaseStudyCard key={i} t={t} />
          ))}
        </div>

        {/* Row 2: Scrolls Right */}
        <div className="flex w-fit animate-scroll-right pause-on-hover">
          {row2.map((t, i) => (
            <MicroCaseStudyCard key={i} t={t} />
          ))}
        </div>
      </div>
      
    </section>
  );
}
