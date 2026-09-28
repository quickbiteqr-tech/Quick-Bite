"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Receipt, BellRing, X, CheckCircle2, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// --- Interfaces ---
interface Table {
  id: string;
  table_number: string;
  restaurant_id: string;
}

interface OrderItem {
  quantity: number;
  price: number;
  variant_label?: string | null;
  menu_item: { name: string } | { name: string }[];
}

interface Order {
  id: string;
  status: string;
  is_paid: boolean;
  table_id: string | null;
  order_items: OrderItem[];
}

interface ServiceRequest {
  id: string;
  table_number: string;
  status: string;
  request_type: string;
}

interface ProcessedTable extends Table {
  orders: Order[];
  requests: ServiceRequest[];
  grandTotal: number;
  isActive: boolean;
  hasServiceRequest: boolean;
}

// --- Components ---

const TableCard = ({ table, onSettle }: { table: ProcessedTable, onSettle: (t: ProcessedTable) => void }) => {
  const { table_number, isActive, hasServiceRequest, grandTotal, requests } = table;

  let borderColor = "border-slate-200";
  let bgColor = "bg-white";
  let statusText = "Empty";
  let statusColor = "text-slate-400";
  
  if (hasServiceRequest) {
    borderColor = "border-amber-300";
    bgColor = "bg-amber-50/40";
    statusText = "Service Requested";
    statusColor = "text-amber-600";
  } else if (isActive) {
    borderColor = "border-blue-300";
    bgColor = "bg-blue-50/40";
    statusText = "Active Session";
    statusColor = "text-blue-600";
  }

  return (
    <div className={`relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all duration-300 ${borderColor} ${bgColor} shadow-sm hover:shadow-md h-full min-h-[240px]`}>
      {hasServiceRequest && (
        <div className="absolute inset-0 rounded-3xl border-2 border-amber-400 animate-pulse pointer-events-none" />
      )}
      
      <div className="z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">T{table_number}</h3>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/70 backdrop-blur-sm shadow-sm ${statusColor}`}>
            {statusText}
          </span>
        </div>
        
        {isActive && !hasServiceRequest && (
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Running Bill</p>
            <p className="text-3xl font-black text-slate-900">₹{grandTotal.toFixed(2)}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{table.orders.length} order(s)</p>
          </div>
        )}
        
        {hasServiceRequest && (
          <div className="mt-2 flex flex-col gap-3">
             {isActive && (
               <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl shadow-sm border border-slate-100/50">
                 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Running Bill</span>
                 <span className="font-black text-lg text-slate-900">₹{grandTotal.toFixed(2)}</span>
               </div>
             )}
            <div className="flex flex-wrap gap-2 mt-1">
              {requests.map(r => (
                <span key={r.id} className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200/50">
                  <BellRing size={12} /> {r.request_type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <button 
          onClick={() => onSettle(table)}
          className="mt-6 w-full py-4 bg-[#6DBE45] hover:bg-[#5aa337] text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 z-10"
        >
          <Receipt size={18} />
          Settle ₹{grandTotal.toFixed(2)}
        </button>
      )}
    </div>
  );
};

const SettleModal = ({ table, onClose, onConfirm, settling }: { table: ProcessedTable | null, onClose: () => void, onConfirm: (id: string) => void, settling: boolean }) => {
  if (!table) return null;

  // Aggregate items
  const itemsMap: Record<string, { name: string, variant: string | null | undefined, quantity: number, total: number }> = {};
  table.orders.forEach(o => {
    o.order_items.forEach(item => {
      const itemName = Array.isArray(item.menu_item) ? item.menu_item[0]?.name : item.menu_item?.name || 'Unknown';
      const key = `${itemName}-${item.variant_label || ''}`;
      if (!itemsMap[key]) {
        itemsMap[key] = { name: itemName, variant: item.variant_label, quantity: 0, total: 0 };
      }
      itemsMap[key].quantity += item.quantity;
      itemsMap[key].total += item.price * item.quantity;
    });
  });
  const aggregatedItems = Object.values(itemsMap);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Settle Table {table.table_number}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Review itemized receipt</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4">
          {aggregatedItems.map((item, idx) => (
             <div key={idx} className="flex justify-between items-start text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex gap-3 text-slate-700">
                  <span className="font-black text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm h-fit">{item.quantity}x</span>
                  <div className="flex flex-col pt-0.5">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    {item.variant && <span className="text-[11px] font-semibold text-slate-400 mt-0.5">{item.variant}</span>}
                  </div>
                </div>
                <div className="font-black text-slate-800 pt-0.5">₹{item.total.toFixed(2)}</div>
             </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-5 mt-auto">
          <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-2xl">
            <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Grand Total</span>
            <span className="text-3xl font-black text-[#6DBE45]">₹{table.grandTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => onConfirm(table.id)}
            disabled={settling}
            className="w-full flex items-center justify-center gap-2 bg-[#6DBE45] hover:bg-[#5aa337] text-white font-bold rounded-2xl py-4 shadow-lg disabled:opacity-70 transition-all active:scale-[0.98]"
          >
            {settling ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Confirm Payment & Clear Table</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};


// --- Main Page Component ---

export default function FOHCommandCenter() {
  const [loading, setLoading] = useState(true);
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  
  const [selectedTable, setSelectedTable] = useState<ProcessedTable | null>(null);
  const [settling, setSettling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rests } = await supabase.from('restaurants').select('id').eq('user_id', user.id);
      const ids = (rests || []).map(r => r.id);
      setRestaurantIds(ids);

      if (!ids.length) {
        setLoading(false);
        return;
      }

      const [tablesRes, ordersRes, reqsRes] = await Promise.all([
        supabase.from('tables').select('id, table_number, restaurant_id').in('restaurant_id', ids),
        supabase.from('orders').select(`
          id, status, is_paid, table_id,
          order_items ( quantity, price, variant_label, menu_item:menu_item_id ( name ) )
        `).in('restaurant_id', ids).eq('is_paid', false).neq('status', 'cancelled'),
        supabase.from('service_requests').select('id, table_number, status, request_type').in('restaurant_id', ids).eq('status', 'pending')
      ]);

      if (tablesRes.data) setTables(tablesRes.data);
      if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
      if (reqsRes.data) setRequests(reqsRes.data);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load live data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!restaurantIds.length) return;
    
    const channels = restaurantIds.map(rid => {
      const ch = supabase.channel(`foh-${rid}`);
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rid}` }, () => fetchData());
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `restaurant_id=eq.${rid}` }, () => fetchData());
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${rid}` }, () => fetchData());
      return ch.subscribe();
    });

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [restaurantIds, fetchData]);

  const tablesGrid = useMemo(() => {
    const sortedTables = [...tables].sort((a, b) => 
      a.table_number.localeCompare(b.table_number, undefined, { numeric: true })
    );

    return sortedTables.map(t => {
      const tableOrders = orders.filter(o => o.table_id === t.id);
      const tableRequests = requests.filter(r => String(r.table_number) === String(t.table_number));
      
      let grandTotal = 0;
      tableOrders.forEach(o => {
        o.order_items.forEach(item => {
          grandTotal += (item.price || 0) * (item.quantity || 1);
        });
      });

      return {
        ...t,
        orders: tableOrders,
        requests: tableRequests,
        grandTotal,
        isActive: tableOrders.length > 0,
        hasServiceRequest: tableRequests.length > 0
      };
    });
  }, [tables, orders, requests]);

  const handleSettleConfirm = async (tableId: string) => {
    setSettling(true);
    try {
      const res = await fetch('/api/admin/settle-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      });
      if (!res.ok) throw new Error('Failed to settle');
      toast.success('Table successfully settled and cleared!');
      setSelectedTable(null);
      await fetchData(); 
    } catch (e) {
      toast.error('An error occurred while settling the table.');
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#6DBE45]" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6DBE45]/10 flex items-center justify-center text-[#6DBE45]">
            <LayoutGrid size={22} />
          </div>
          Floor Plan
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2 ml-13">
          Manage live tables, service requests, and active sessions.
        </p>
      </div>

      {tablesGrid.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <LayoutGrid className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No tables found</h3>
          <p className="text-slate-500 mt-2">Add tables to your restaurant to see them here.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {tablesGrid.map(table => (
            <TableCard key={table.id} table={table} onSettle={(t) => setSelectedTable(t)} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedTable && (
          <SettleModal 
            table={selectedTable} 
            onClose={() => setSelectedTable(null)} 
            onConfirm={handleSettleConfirm}
            settling={settling} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
