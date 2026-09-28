"use client";

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, X, Clock, Receipt, Utensils, Timer, Percent, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Timeframe = 'today' | 'week' | 'month';
type MetricType = 'revenue' | 'orders' | 'turns';

// --- ROBUST MOCK DATA ARCHITECTURE ---
const MOCK_DATA = {
  today: {
    label: "Today vs Yesterday",
    totals: { revenue: 42500, prevRevenue: 37900, orders: 142, prevOrders: 120, turns: 65, prevTurns: 55 },
    aov: 850,
    pacing: [
      { time: '10 AM', current_revenue: 1200, previous_revenue: 900, current_orders: 5, previous_orders: 4, current_turns: 2, previous_turns: 1 },
      { time: '12 PM', current_revenue: 4500, previous_revenue: 3200, current_orders: 15, previous_orders: 10, current_turns: 5, previous_turns: 4 },
      { time: '2 PM', current_revenue: 12500, previous_revenue: 11000, current_orders: 45, previous_orders: 40, current_turns: 12, previous_turns: 10 },
      { time: '4 PM', current_revenue: 18000, previous_revenue: 15500, current_orders: 65, previous_orders: 55, current_turns: 18, previous_turns: 15 },
      { time: '6 PM', current_revenue: 28000, previous_revenue: 26000, current_orders: 95, previous_orders: 85, current_turns: 25, previous_turns: 22 },
      { time: '8 PM', current_revenue: 42500, previous_revenue: 37900, current_orders: 142, previous_orders: 120, current_turns: 38, previous_turns: 30 },
    ],
    sparklineAov: [{v:800},{v:820},{v:790},{v:850},{v:830},{v:850}],
    sparklineOrders: [{v:5},{v:12},{v:8},{v:22},{v:35},{v:50}],
    dishes: [
      { id: 1, name: 'Truffle Burger', category: 'Mains', price: 300, revenue: 14400, qty: 48, prepDelay: '8m', revContrib: 34, sparkline: [{v:2},{v:5},{v:12},{v:8},{v:15},{v:6}], image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80', comparative: [{time: '12 PM', cur: 10, prev: 5}, {time: '4 PM', cur: 15, prev: 12}, {time: '8 PM', cur: 23, prev: 18}] },
      { id: 2, name: 'Spicy Rigatoni', category: 'Pasta', price: 450, revenue: 16200, qty: 36, prepDelay: '12m', revContrib: 38, sparkline: [{v:0},{v:2},{v:4},{v:10},{v:12},{v:8}], image: 'https://images.unsplash.com/photo-1645696301019-35adcc18fc21?auto=format&fit=crop&w=300&q=80', comparative: [{time: '12 PM', cur: 6, prev: 8}, {time: '4 PM', cur: 12, prev: 10}, {time: '8 PM', cur: 18, prev: 15}] },
      { id: 3, name: 'Classic Margherita', category: 'Pizza', price: 350, revenue: 10850, qty: 31, prepDelay: '15m', revContrib: 25, sparkline: [{v:5},{v:4},{v:8},{v:6},{v:4},{v:4}], image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?auto=format&fit=crop&w=300&q=80', comparative: [{time: '12 PM', cur: 12, prev: 10}, {time: '4 PM', cur: 10, prev: 8}, {time: '8 PM', cur: 9, prev: 12}] },
    ]
  },
  week: {
    label: "This Week vs Last Week",
    totals: { revenue: 285400, prevRevenue: 250000, orders: 980, prevOrders: 820, turns: 420, prevTurns: 380 },
    aov: 920,
    pacing: [
      { time: 'Mon', current_revenue: 35000, previous_revenue: 32000, current_orders: 120, previous_orders: 110, current_turns: 50, previous_turns: 48 },
      { time: 'Tue', current_revenue: 42000, previous_revenue: 38000, current_orders: 145, previous_orders: 130, current_turns: 60, previous_turns: 55 },
      { time: 'Wed', current_revenue: 38000, previous_revenue: 35000, current_orders: 130, previous_orders: 120, current_turns: 55, previous_turns: 50 },
      { time: 'Thu', current_revenue: 45000, previous_revenue: 41000, current_orders: 155, previous_orders: 140, current_turns: 65, previous_turns: 60 },
      { time: 'Fri', current_revenue: 65000, previous_revenue: 55000, current_orders: 220, previous_orders: 190, current_turns: 90, previous_turns: 80 },
      { time: 'Sat', current_revenue: 85000, previous_revenue: 72000, current_orders: 280, previous_orders: 240, current_turns: 120, previous_turns: 100 },
      { time: 'Sun', current_revenue: 25000, previous_revenue: 42000, current_orders: 85, previous_orders: 140, current_turns: 35, previous_turns: 60 },
    ],
    sparklineAov: [{v:850},{v:860},{v:840},{v:900},{v:950},{v:1020},{v:920}],
    sparklineOrders: [{v:120},{v:145},{v:130},{v:155},{v:220},{v:280},{v:85}],
    dishes: [
      { id: 1, name: 'Truffle Burger', category: 'Mains', price: 300, revenue: 84400, qty: 281, prepDelay: '7m', revContrib: 29, sparkline: [{v:30},{v:35},{v:40},{v:42},{v:60},{v:74}], image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80', comparative: [{time: 'Tue', cur: 30, prev: 25}, {time: 'Thu', cur: 45, prev: 40}, {time: 'Sat', cur: 80, prev: 65}] },
      { id: 2, name: 'Spicy Rigatoni', category: 'Pasta', price: 450, revenue: 95200, qty: 211, prepDelay: '11m', revContrib: 33, sparkline: [{v:20},{v:22},{v:28},{v:35},{v:50},{v:56}], image: 'https://images.unsplash.com/photo-1645696301019-35adcc18fc21?auto=format&fit=crop&w=300&q=80', comparative: [{time: 'Tue', cur: 25, prev: 20}, {time: 'Thu', cur: 38, prev: 35}, {time: 'Sat', cur: 60, prev: 50}] },
    ]
  },
  month: {
    label: "This Month vs Last Month",
    totals: { revenue: 1250000, prevRevenue: 1100000, orders: 4200, prevOrders: 3800, turns: 1850, prevTurns: 1600 },
    aov: 890,
    pacing: [
      { time: 'Week 1', current_revenue: 300000, previous_revenue: 280000, current_orders: 1000, previous_orders: 950, current_turns: 450, previous_turns: 420 },
      { time: 'Week 2', current_revenue: 320000, previous_revenue: 290000, current_orders: 1100, previous_orders: 1000, current_turns: 480, previous_turns: 440 },
      { time: 'Week 3', current_revenue: 350000, previous_revenue: 310000, current_orders: 1200, previous_orders: 1050, current_turns: 520, previous_turns: 460 },
      { time: 'Week 4', current_revenue: 280000, previous_revenue: 220000, current_orders: 900, previous_orders: 800, current_turns: 400, previous_turns: 280 },
    ],
    sparklineAov: [{v:850},{v:880},{v:910},{v:890}],
    sparklineOrders: [{v:1000},{v:1100},{v:1200},{v:900}],
    dishes: [
      { id: 1, name: 'Truffle Burger', category: 'Mains', price: 300, revenue: 384400, qty: 1281, prepDelay: '8m', revContrib: 30, sparkline: [{v:280},{v:310},{v:340},{v:351}], image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80', comparative: [{time: 'W1', cur: 280, prev: 250}, {time: 'W3', cur: 360, prev: 310}] },
      { id: 2, name: 'Spicy Rigatoni', category: 'Pasta', price: 450, revenue: 415200, qty: 922, prepDelay: '12m', revContrib: 33, sparkline: [{v:180},{v:220},{v:260},{v:262}], image: 'https://images.unsplash.com/photo-1645696301019-35adcc18fc21?auto=format&fit=crop&w=300&q=80', comparative: [{time: 'W1', cur: 180, prev: 160}, {time: 'W3', cur: 280, prev: 240}] },
    ]
  }
};

const HEATMAP_DATA = [
  { id: 'T1', turnover: '45m', aov: 1200, revenue: 3200, turns: 4, status: 'high' },
  { id: 'T2', turnover: '42m', aov: 1550, revenue: 3100, turns: 2, status: 'high' },
  { id: 'T3', turnover: '65m', aov: 600, revenue: 1200, turns: 2, status: 'low' },
  { id: 'T4', turnover: '38m', aov: 1025, revenue: 4100, turns: 4, status: 'optimal' },
  { id: 'T5', turnover: '40m', aov: 1266, revenue: 3800, turns: 3, status: 'optimal' },
  { id: 'T6', turnover: '55m', aov: 700, revenue: 2100, turns: 3, status: 'medium' },
  { id: 'T7', turnover: '62m', aov: 700, revenue: 1400, turns: 2, status: 'low' },
  { id: 'T8', turnover: '35m', aov: 1500, revenue: 4500, turns: 3, status: 'optimal' },
  { id: 'T9', turnover: '48m', aov: 933, revenue: 2800, turns: 3, status: 'high' },
  { id: 'T10', turnover: '50m', aov: 866, revenue: 2600, turns: 3, status: 'medium' },
];

const getHeatmapColor = (status: string) => {
  switch (status) {
    case 'optimal': return 'bg-[#4A8F2F] text-white border-transparent';
    case 'high': return 'bg-[#6DBE45] text-white border-transparent';
    case 'medium': return 'bg-[#a3df87] text-slate-800 border-transparent';
    case 'low': return 'bg-rose-50 text-rose-600 border-rose-200';
    default: return 'bg-slate-100 text-slate-400 border-slate-200';
  }
};

const TinySparkline = ({ data, color }: { data: any[], color: string }) => (
  <div className="w-16 h-8">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);


export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [activeMetric, setActiveMetric] = useState<MetricType>('revenue');
  
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);

  const data = MOCK_DATA[timeframe];

  // Dynamic Metric Configuration
  const metricConfig = useMemo(() => {
    switch(activeMetric) {
      case 'orders': return { key: 'orders', name: 'Orders Count', prefix: '', suffix: '', formatter: (v: number) => v.toLocaleString() };
      case 'turns': return { key: 'turns', name: 'Table Turns', prefix: '', suffix: ' Tables', formatter: (v: number) => v.toLocaleString() };
      case 'revenue': 
      default: return { key: 'revenue', name: 'Revenue', prefix: '₹', suffix: '', formatter: (v: number) => `${(v/1000).toFixed(1)}k` };
    }
  }, [activeMetric]);

  const currentTotal = data.totals[metricConfig.key as keyof typeof data.totals] as number;
  const prevTotal = data.totals[`prev${metricConfig.key.charAt(0).toUpperCase() + metricConfig.key.slice(1)}` as keyof typeof data.totals] as number;
  const growth = ((currentTotal - prevTotal) / prevTotal) * 100;
  const isPositive = growth >= 0;

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans flex flex-col pb-24 lg:pb-12 overflow-x-hidden">
       
       {/* ATC Header & Global Time Controls */}
       <div className="mb-8 shrink-0 px-4 md:px-6 lg:px-8 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
               Performance
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
               Rich operational drill-downs.
            </p>
          </div>
          
          <div className="flex items-center bg-slate-200/50 p-1 rounded-xl shrink-0">
             {(['today', 'week', 'month'] as Timeframe[]).map(tf => (
               <button
                 key={tf}
                 onClick={() => setTimeframe(tf)}
                 className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                   timeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 {tf === 'today' ? 'Today' : `This ${tf}`}
               </button>
             ))}
          </div>
       </div>

       <div className="px-4 md:px-6 lg:px-8 flex flex-col gap-6">
         
         {/* --- TASK 1: MASTER PACING CHART --- */}
         <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
           <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pacing</h2>
                    {/* Inline Metric Switcher */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                       {(['revenue', 'orders', 'turns'] as MetricType[]).map(m => (
                         <button
                           key={m}
                           onClick={() => setActiveMetric(m)}
                           className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                             activeMetric === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                           }`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                 </div>
                 
                 <div className="flex items-end gap-4">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter font-serif">
                      {metricConfig.prefix}{currentTotal.toLocaleString()}{metricConfig.suffix}
                    </span>
                    <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full mb-1 ${isPositive ? 'bg-[#6DBE45]/10 text-[#4A8F2F]' : 'bg-rose-50 text-rose-600'}`}>
                       {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                       {Math.abs(growth).toFixed(1)}% vs Prev
                    </div>
                 </div>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-2 text-xs font-bold text-slate-500">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#6DBE45]" /> Current Period
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-slate-300 border-t-2 border-dashed border-slate-300" /> {data.label.split('vs ')[1]}
                 </div>
              </div>
           </div>

           <div className="w-full h-[320px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data.pacing} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6DBE45" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#6DBE45" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={metricConfig.formatter as any} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                   itemStyle={{ fontWeight: 800 }}
                 />
                 <Area type="monotone" dataKey={`previous_${metricConfig.key}`} name={data.label.split('vs ')[1]} stroke="#cbd5e1" strokeWidth={3} strokeDasharray="5 5" fill="transparent" />
                 <Area type="monotone" dataKey={`current_${metricConfig.key}`} name="Current Period" stroke="#6DBE45" strokeWidth={4} fillOpacity={1} fill="url(#colorCurrent)" activeDot={{ r: 6, fill: '#6DBE45', stroke: '#fff', strokeWidth: 2 }} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
         </div>


         {/* Row 2: Order Analytics & Table Heatmap */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dish-Wise Rich Data List */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex-1">
                 <div className="mb-6">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Dish Performance</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Tap a dish for Drill-Down</p>
                 </div>
                 <div className="flex flex-col gap-4">
                    {data.dishes.map(dish => (
                      <button 
                        key={dish.id} 
                        onClick={() => setSelectedDish(dish)}
                        className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
                      >
                         <img src={dish.image} alt={dish.name} className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0" />
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{dish.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dish.category}</p>
                         </div>
                         <div className="hidden sm:block">
                            <TinySparkline data={dish.sparkline} color="#94a3b8" />
                         </div>
                         <div className="text-right shrink-0">
                            <p className="font-black text-[#6DBE45]">₹{dish.revenue.toLocaleString()}</p>
                            <p className="text-xs font-semibold text-slate-500">{dish.qty} Sold</p>
                         </div>
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            {/* TASK 3: Table Heatmap */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col">
               <div className="mb-6">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Floor Density</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Tap a table for Drill-Down</p>
               </div>
               
               <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 flex-1 content-start">
                  {HEATMAP_DATA.map((table) => (
                     <button 
                       key={table.id} 
                       onClick={() => setSelectedTable(table)}
                       className={`aspect-square rounded-2xl border flex flex-col items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.03)] transition-all hover:scale-105 active:scale-95 ${getHeatmapColor(table.status)}`}
                     >
                        <span className="font-black text-xl sm:text-2xl">{table.id}</span>
                        <span className="text-[10px] font-bold opacity-80 mt-1">₹{table.revenue/1000}k</span>
                     </button>
                  ))}
               </div>
            </div>

         </div>
       </div>


       {/* --- TASK 2: DISH DRILL-DOWN SHEET --- */}
       <AnimatePresence>
         {selectedDish && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedDish(null)}
               className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
             />
             <motion.div
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white z-[101] shadow-2xl flex flex-col border-l border-slate-100 overflow-hidden"
             >
                <div className="relative h-48 shrink-0">
                   <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                   <button onClick={() => setSelectedDish(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                   <div className="absolute bottom-4 left-6">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">{selectedDish.category}</p>
                      <h2 className="text-2xl font-black text-white tracking-tight">{selectedDish.name}</h2>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                           <Utensils size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Units Sold</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900">{selectedDish.qty}</p>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                           <Clock size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Avg Prep Time</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900">{selectedDish.prepDelay}</p>
                      </div>
                      <div className="col-span-2 bg-[#6DBE45]/10 rounded-2xl p-4 border border-[#6DBE45]/20 flex justify-between items-center">
                         <div className="flex items-center gap-2 text-[#4A8F2F]">
                           <Percent size={18} /> <span className="text-sm font-black tracking-tight">Revenue Contribution</span>
                         </div>
                         <p className="text-3xl font-black text-[#4A8F2F] font-serif">{selectedDish.revContrib}%</p>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Sales Velocity</h3>
                      <div className="h-[200px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedDish.comparative}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="prev" name="Prev Period" stroke="#cbd5e1" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                            <Line type="monotone" dataKey="cur" name="Current" stroke="#6DBE45" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>

       {/* --- TASK 3: TABLE DRILL-DOWN SHEET --- */}
       <AnimatePresence>
         {selectedTable && (
           <>
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedTable(null)}
               className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
             />
             <motion.div
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white z-[101] shadow-2xl flex flex-col border-l border-slate-100"
             >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                   <div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">Table {selectedTable.id}</h2>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Performance Drill-down</p>
                   </div>
                   <button onClick={() => setSelectedTable(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                           <Users size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Historical Turns</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900 font-serif">{selectedTable.turns}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                           <Clock size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Avg Dining Time</span>
                         </div>
                         <p className="text-2xl font-black text-slate-900 font-serif">{selectedTable.turnover}</p>
                      </div>
                      <div className="col-span-2 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
                         <div className="flex items-center gap-2 text-emerald-700">
                           <Utensils size={18} /> <span className="text-sm font-black tracking-tight">Total Billed</span>
                         </div>
                         <p className="text-3xl font-black text-emerald-700 font-serif">₹{selectedTable.revenue.toLocaleString()}</p>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Recent Orders (Last 24h)</h3>
                      <div className="space-y-3">
                         {Array.from({ length: selectedTable.turns }).map((_, i) => (
                           <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="font-bold text-slate-800">Order #{8493 - i}</p>
                                <p className="text-xs font-semibold text-slate-400 mt-1">{i * 15 + 10} mins ago • {4 - i} items</p>
                              </div>
                              <p className="font-black text-slate-900">₹{(selectedTable.aov * (1 + (i*0.1))).toFixed(0)}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>
    </div>
  );
}
