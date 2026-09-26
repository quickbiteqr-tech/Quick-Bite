'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Receipt, CheckCircle2, Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

interface OrderItem {
  quantity: number;
  price: number;
  variant_label?: string | null;
  menu_item: { name: string } | { name: string }[];
}

interface Order {
  id: string;
  status: string;
  track_code: string | null;
  table: { id: string; table_number: string } | null;
  order_items: OrderItem[];
}

interface GroupedTable {
  tableId: string;
  tableNumber: string;
  orders: Order[];
  grandTotal: number;
  isProcessing: boolean;
}

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [tables, setTables] = useState<GroupedTable[]>([]);
  const { toast } = useToast();

  const fetchUnpaidOrders = useCallback(async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated');

      const { data: restaurants, error: restErr } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id);

      if (restErr) throw restErr;

      const ids = (restaurants ?? []).map(r => r.id);
      setRestaurantIds(ids);

      if (ids.length === 0) {
        setTables([]);
        return;
      }

      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          id, status, track_code,
          table:tables!inner ( id, table_number ),
          order_items (
            quantity, price, variant_label,
            menu_item:menu_item_id ( name )
          )
        `)
        .in('restaurant_id', ids)
        .eq('is_paid', false)
        .neq('status', 'cancelled');

      if (ordersErr) throw ordersErr;

      // Group by table_id
      const tableMap = new Map<string, GroupedTable>();

      (ordersData || []).forEach((orderObj: any) => {
        const table = Array.isArray(orderObj.table) ? orderObj.table[0] : orderObj.table;
        const tableId = table?.id;
        const tableNumber = table?.table_number || 'Unknown';

        if (!tableId) return;

        let grandTotal = 0;
        const items: OrderItem[] = orderObj.order_items || [];
        items.forEach((item: any) => {
          grandTotal += (item.price || 0) * (item.quantity || 1);
        });

        if (!tableMap.has(tableId)) {
          tableMap.set(tableId, {
            tableId,
            tableNumber,
            orders: [],
            grandTotal: 0,
            isProcessing: false
          });
        }

        const t = tableMap.get(tableId)!;
        t.orders.push(orderObj as Order);
        t.grandTotal += grandTotal;
      });

      setTables(Array.from(tableMap.values()));
    } catch (e) {
      console.error('Failed to fetch unpaid orders:', e);
      toast({
        title: 'Error',
        description: 'Failed to load billing data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUnpaidOrders();
  }, [fetchUnpaidOrders]);

  useEffect(() => {
    if (!restaurantIds.length) return;
    
    const channels = restaurantIds.map((rid) =>
      supabase
        .channel(`billing-orders-${rid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${rid}` },
          () => fetchUnpaidOrders()
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [restaurantIds, fetchUnpaidOrders]);

  const handleSettleTable = async (tableId: string) => {
    setTables(prev => prev.map(t => t.tableId === tableId ? { ...t, isProcessing: true } : t));
    
    try {
      const res = await fetch('/api/admin/settle-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      });

      if (!res.ok) {
        throw new Error('Failed to settle table');
      }

      toast({
        title: 'Success',
        description: 'Bill marked as paid and table cleared',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'An error occurred settling the bill',
        variant: 'destructive',
      });
      setTables(prev => prev.map(t => t.tableId === tableId ? { ...t, isProcessing: false } : t));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#6DBE45]" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white text-center">
        <Receipt className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">No active bills</h3>
        <p className="text-sm text-slate-500">All tables are settled.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tables.map((tableGroup) => (
        <div key={tableGroup.tableId} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Table {tableGroup.tableNumber}</h3>
                <p className="text-xs font-semibold text-slate-500">{tableGroup.orders.length} Order(s)</p>
              </div>
            </div>
          </div>

          {/* Aggregated Bill Summary */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-6 max-h-[400px]">
            {Object.values(
              tableGroup.orders.flatMap(o => o.order_items).reduce((acc: any, item) => {
                const itemName = Array.isArray(item.menu_item) 
                  ? item.menu_item[0]?.name 
                  : (item.menu_item as { name: string })?.name || 'Unknown Item';
                
                const key = `${itemName}-${item.variant_label || ''}`;
                if (!acc[key]) {
                  acc[key] = { name: itemName, variant: item.variant_label, quantity: 0, total: 0 };
                }
                acc[key].quantity += item.quantity;
                acc[key].total += (item.price * item.quantity);
                return acc;
              }, {})
            ).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div className="flex gap-2 text-slate-700">
                  <span className="font-bold text-slate-500">{item.quantity}x</span>
                  <div>
                    <span className="font-semibold">{item.name}</span>
                    {item.variant && <div className="text-xs text-slate-400">{item.variant}</div>}
                  </div>
                </div>
                <div className="font-bold text-slate-800">
                  ₹{item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Action */}
          <div className="mt-auto pt-4 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Grand Total</span>
              <span className="text-2xl font-bold text-slate-900">₹{tableGroup.grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => handleSettleTable(tableGroup.tableId)}
              disabled={tableGroup.isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-[#6DBE45] hover:bg-[#5aa337] transition-colors text-white font-bold rounded-xl py-3.5 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {tableGroup.isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Paid & Clear
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
