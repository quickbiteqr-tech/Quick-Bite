"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
  id: string;
  table_id: number | string;
  status: "Preparing" | "Ready" | "Served" | string;
  total_amount: number | string;
  created_at: string;
  estimated_time: number | string | null;
};

function getStatusColor(status: string) {
  switch (status) {
    case "Preparing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Ready":
      return "bg-green-100 text-green-800 border-green-200";
    case "Served":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function LiveOrdersPanel() {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    async function fetchOrders() {

      const { data, error } = await supabase
        .from("orders")
        .select("id, table_id, status, total_amount, created_at, estimated_time")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data) setLiveOrders(data as Order[]);
    }

    fetchOrders();

    const channel = supabase
      .channel("orders-insert")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          setLiveOrders((prev) => [payload.new as Order, ...prev].slice(0, 12));
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totals = useMemo(() => {
    const totalValue = liveOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const readyCount = liveOrders.filter((o) => o.status === "Ready").length;
    return { totalValue, readyCount };
  }, [liveOrders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full bg-blue-600 text-white transition-all duration-300 ${
                  isPulsing ? "animate-pulse" : ""
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">Live Orders</CardTitle>
                <p className="text-slate-600 text-sm">Real-time order tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{liveOrders.length}</div>
                <div className="text-xs text-slate-600">Active Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.readyCount}</div>
                <div className="text-xs text-slate-600">Served</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{totals.totalValue.toFixed(2)}</div>
                <div className="text-xs text-slate-600">Total Value</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">#{order.id}</span>
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Table:</span>
                <span className="font-medium">{order.table_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span className="font-medium text-green-600">₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Time:</span>
                <span className="font-medium text-blue-600">
                  {new Date(order.created_at).toLocaleTimeString()}
                </span>
              </div>
              {order.estimated_time && (
                <div className="flex justify-between text-sm">
                  <span>ETA:</span>
                  <span className="font-medium text-purple-600">{order.estimated_time} min</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
