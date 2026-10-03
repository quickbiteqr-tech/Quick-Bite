"use client";

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, X, Clock, Receipt, Utensils, Timer, Percent, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import useSWR from 'swr';

type Timeframe = 'today' | 'week' | 'month';
type MetricType = 'revenue' | 'orders' | 'turns';

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
};

export interface AnalyticsPayload {
  label: string;
  totals: { revenue: number, prevRevenue: number, orders: number, prevOrders: number, turns: number, prevTurns: number };
  aov: number;
  pacing: { time: string, current_revenue: number, previous_revenue: number, current_orders: number, previous_orders: number }[];
  dishes: { id: string, name: string, category: string, price: number, qty: number, revenue: number, sparkline: {v: number}[], image?: string, prepDelay?: string, revContrib?: number, comparative?: any[] }[];
  heatmap: { id: string, turns: number, revenue: number, turnover: string, status: 'high' | 'optimal' | 'medium' | 'low' }[];
}



const getHeatmapColor = (status: string) => {
  switch (status) {
    case 'optimal': return 'bg-[#4A8F2F] text-white border-transparent';
    case 'high': return 'bg-[#6DBE45] text-white border-transparent';
    case 'medium': return 'bg-[#a3df87] text-slate-800 border-transparent';
    case 'low': return 'bg-rose-50 text-rose-600 border-rose-200';
    default: return 'bg-slate-100 text-slate-400 border-slate-200';
  }
};

const TinySparkline = ({ data, color }: { data: any[], color: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-16 h-8 bg-slate-50 rounded-md border border-slate-100">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight">No Data</span>
      </div>
    );
  }

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="w-full min-h-screen bg-slate-50 font-sans flex flex-col pb-24 lg:pb-12 overflow-x-hidden animate-pulse">
    <div className="mb-8 shrink-0 px-4 md:px-6 lg:px-8 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div>
        <div className="h-10 w-48 bg-slate-200 rounded-lg mb-2"></div>
        <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
      </div>
      <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
    </div>
    
    <div className="px-4 md:px-6 lg:px-8 flex flex-col gap-6">
      {/* Master Pacing Chart Skeleton */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
             <div className="h-6 w-32 bg-slate-200 rounded-md mb-4"></div>
             <div className="h-12 w-48 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="flex flex-col gap-2">
             <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
             <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
          </div>
        </div>
        <div className="w-full h-[320px] bg-slate-100 rounded-xl"></div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex-1">
          <div className="mb-6"><div className="h-6 w-48 bg-slate-200 rounded-md"></div></div>
          <div className="flex flex-col gap-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center gap-4 p-3 rounded-2xl">
                 <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                 <div className="flex-1 space-y-2">
                   <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                   <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                 </div>
                 <div className="space-y-2 text-right">
                   <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
                   <div className="h-3 w-12 bg-slate-200 rounded-md ml-auto"></div>
                 </div>
               </div>
             ))}
          </div>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col">
          <div className="mb-6"><div className="h-6 w-48 bg-slate-200 rounded-md"></div></div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 flex-1 content-start">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
               <div key={i} className="aspect-square rounded-2xl bg-slate-200"></div>
             ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('API Error');
  return res.json();
});

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [activeMetric, setActiveMetric] = useState<MetricType>('revenue');
  
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);

  const { data, error, isLoading } = useSWR<AnalyticsPayload>(`/api/admin/analytics?timeframe=${timeframe}`, fetcher);

  // Dynamic Metric Configuration
  const metricConfig = useMemo(() => {
    switch(activeMetric) {
      case 'orders': return { key: 'orders', name: 'Orders Count', prefix: '', suffix: '', formatter: (v: number) => v.toLocaleString() };
      case 'turns': return { key: 'turns', name: 'Table Turns', prefix: '', suffix: ' Tables', formatter: (v: number) => v.toLocaleString() };
      case 'revenue': 
      default: return { key: 'revenue', name: 'Revenue', prefix: '₹', suffix: '', formatter: (v: number) => `${(v/1000).toFixed(1)}k` };
    }
  }, [activeMetric]);

  if (isLoading || !data) return <DashboardSkeleton />;
  if (error) return <div className="p-8 text-red-500 font-bold">Failed to load analytics data.</div>;

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
                    {data.dishes.map((dish: any) => (
                      <button 
                        key={dish.id} 
                        onClick={() => setSelectedDish(dish)}
                        className="flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
                      >
                         <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                           {dish.image ? (
                             <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                           ) : (
                             <Utensils size={20} className="text-slate-300" />
                           )}
                         </div>
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
                  {data.heatmap?.map((table: any) => (
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
                   {selectedDish.image ? (
                     <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                       <Utensils size={40} className="text-white/20" />
                     </div>
                   )}
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
                         {selectedTable.recent_orders?.length > 0 ? selectedTable.recent_orders.map((o: any) => (
                           <div key={o.id} className="flex flex-col gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-slate-800 uppercase">Order #{o.id}</p>
                                  <p className="text-xs font-semibold text-slate-400 mt-1">{getTimeAgo(o.time)} • {o.items_count} items</p>
                                </div>
                                <p className="font-black text-slate-900">₹{o.amount.toLocaleString()}</p>
                              </div>
                              {/* Order Items List */}
                              {o.items_list && o.items_list.length > 0 && (
                                <div className="pt-3 border-t border-slate-100/60 flex flex-col gap-1.5">
                                  {o.items_list.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                      <span className="w-5 h-5 flex items-center justify-center bg-slate-200/50 rounded-md text-[10px] text-slate-700">{item.qty}x</span>
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                         )) : (
                           <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recent orders</p>
                           </div>
                         )}
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
