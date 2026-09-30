import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// --- ZERO STATE GUARDRAIL ---
const ZERO_STATE = {
  label: "No Data vs Previous",
  totals: { revenue: 0, prevRevenue: 0, orders: 0, prevOrders: 0, turns: 0, prevTurns: 0 },
  pacing: [],
  dishes: [],
  heatmap: []
};

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Initialize Rate Limiter: 10 requests per 10 seconds per restaurant
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'today';

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const restaurantId = restaurant.id;

    const { success } = await ratelimit.limit(`analytics_ratelimit:${restaurantId}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // --- LAZY REDIS CACHING (ON-DEMAND) ---
    const cacheKey = `analytics:${restaurantId}:${timeframe}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData);
    }

    let finalData;

    if (timeframe === 'today') {
      finalData = await fetchTodayData(restaurantId, supabase);
      if (finalData && finalData !== ZERO_STATE) {
        await redis.setex(cacheKey, 300, finalData); // 5 mins TTL
      }
    } 
    else if (timeframe === 'week' || timeframe === 'month') {
      finalData = await fetchHistoricalDataFromDB(restaurantId, timeframe);
      if (finalData && finalData !== ZERO_STATE) {
        await redis.setex(cacheKey, 86400, finalData); // 24 hours TTL
      }
    } 
    else {
      return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
    }

    return NextResponse.json(finalData || ZERO_STATE);

  } catch (error: any) {
    // Top-level catch: strictly return ZERO_STATE to prevent frontend 500 crashes
    console.error('Analytics API Unhandled Error:', error);
    return NextResponse.json(ZERO_STATE, { status: 200 });
  }
}

// --- HELPER FUNCTIONS ---

async function fetchHistoricalDataFromDB(restaurantId: string, timeframe: string) {
  const supabase = await createServerClient();
  const today = new Date();
  let start_date, end_date, prev_start, prev_end, interval_text;

  if (timeframe === 'week') {
    start_date = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    end_date = today.toISOString().split('T')[0];
    prev_start = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    prev_end = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    interval_text = 'Day';
  } else {
    start_date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    end_date = today.toISOString().split('T')[0];
    prev_start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    prev_end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
    interval_text = 'Week';
  }

  try {
    // 1. Fetch all rollups for Current & Prev period
    const { data: curRollups, error: err1 } = await supabase.from('daily_analytics_rollup')
      .select('*').eq('restaurant_id', restaurantId).gte('date', start_date).lte('date', end_date).order('date', { ascending: true });
    
    const { data: prevRollups, error: err2 } = await supabase.from('daily_analytics_rollup')
      .select('*').eq('restaurant_id', restaurantId).gte('date', prev_start).lte('date', prev_end).order('date', { ascending: true });


    if (err1 || err2) return ZERO_STATE;
    if (!curRollups) return ZERO_STATE;

    // 2. Aggregate Totals
    const totals = { revenue: 0, prevRevenue: 0, orders: 0, prevOrders: 0, turns: 0, prevTurns: 0 };
    curRollups.forEach(r => { totals.revenue += Number(r.total_revenue); totals.orders += r.total_orders; totals.turns += r.total_turns; });
    (prevRollups || []).forEach(r => { totals.prevRevenue += Number(r.total_revenue); totals.prevOrders += r.total_orders; totals.prevTurns += r.total_turns; });

    // 3. Aggregate Pacing
    const pacingMap = new Map();
    
    if (timeframe === 'week') {
      let curr = new Date(start_date);
      let end = new Date(end_date);
      while (curr <= end) {
        const label = curr.toLocaleDateString('en-US', { weekday: 'short' });
        pacingMap.set(label, { time: label, current_revenue: 0, previous_revenue: 0, current_orders: 0, previous_orders: 0, current_turns: 0, previous_turns: 0 });
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        pacingMap.set(`W${i}`, { time: `W${i}`, current_revenue: 0, previous_revenue: 0, current_orders: 0, previous_orders: 0, current_turns: 0, previous_turns: 0 });
      }
    }

    const getLabel = (d: string) => {
      const date = new Date(d);
      return timeframe === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : `W${Math.ceil(date.getDate() / 7)}`;
    };

    (curRollups || []).forEach(r => {
      const label = getLabel(r.date);
      if (pacingMap.has(label)) {
        const p = pacingMap.get(label);
        p.current_revenue += Number(r.total_revenue); p.current_orders += r.total_orders; p.current_turns += r.total_turns;
      }
    });

    (prevRollups || []).forEach(r => {
      const label = getLabel(r.date);
      // For week, align Monday to Monday. (Rough approximation for SWR)
      if (pacingMap.has(label)) {
        const p = pacingMap.get(label);
        p.previous_revenue += Number(r.total_revenue); p.previous_orders += r.total_orders; p.previous_turns += r.total_turns;
      }
    });

    // 4. Aggregate Dishes
    const dishMap = new Map();
    
    const initializeDish = (id: string) => {
      if (!dishMap.has(id)) {
        const comparativeMap = new Map();
        for (const label of pacingMap.keys()) {
          comparativeMap.set(label, { time: label, cur: 0, prev: 0 });
        }
        dishMap.set(id, { qty: 0, revenue: 0, comparativeMap });
      }
      return dishMap.get(id);
    };

    (curRollups || []).forEach(r => {
      const label = getLabel(r.date);
      (r.dishes_sold || []).forEach((d: any) => {
        const dm = initializeDish(d.dish_id);
        dm.qty += d.qty; dm.revenue += d.revenue;
        if (dm.comparativeMap.has(label)) {
          dm.comparativeMap.get(label).cur += d.qty;
        }
      });
    });

    (prevRollups || []).forEach(r => {
      const label = getLabel(r.date);
      (r.dishes_sold || []).forEach((d: any) => {
        const dm = initializeDish(d.dish_id);
        if (dm.comparativeMap.has(label)) {
          dm.comparativeMap.get(label).prev += d.qty;
        }
      });
    });

    // Fetch Live Dish Metadata
    let finalDishes: any[] = [];
    if (dishMap.size > 0) {
      const { data: menuItems, error: mErr } = await supabase.from('menu_items')
        .select('id, name, category, photo_url, price')
        .in('id', Array.from(dishMap.keys()));

      if (menuItems) {
        finalDishes = menuItems.map((m: any) => {
          const d = dishMap.get(m.id);
          const compArray = Array.from(d.comparativeMap.values());
          return {
            id: m.id, name: m.name, category: m.category, image: m.photo_url, price: m.price,
            qty: d.qty, revenue: d.revenue, revContrib: totals.revenue > 0 ? Math.round((d.revenue / totals.revenue) * 100) : 0,
            prepDelay: '12m', sparkline: compArray.map((c: any) => ({ v: c.cur })), comparative: compArray
          };
        }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 15);
      } else if (mErr) {
        console.error("Menu items fetch error:", mErr);
      }
    }

    // 5. Aggregate Heatmap
    const tableMap = new Map();
    curRollups.forEach(r => {
      (r.table_stats || []).forEach((t: any) => {
        if (!tableMap.has(t.table_id)) tableMap.set(t.table_id, { turns: 0, revenue: 0 });
        const tm = tableMap.get(t.table_id);
        tm.turns += t.turns; tm.revenue += t.revenue;
      });
    });

    let finalHeatmap: any[] = [];
    if (tableMap.size > 0) {
      const { data: tables, error: tErr } = await supabase.from('tables').select('id, table_number').in('id', Array.from(tableMap.keys()));
      if (tables) {
        finalHeatmap = tables.map((t: any) => {
          const tm = tableMap.get(t.id);
          return {
            id: t.table_number, turns: tm.turns, revenue: tm.revenue, turnover: '45m',
            status: tm.revenue > 5000 ? 'optimal' : tm.revenue > 2000 ? 'high' : tm.revenue > 1000 ? 'medium' : 'low',
            recent_orders: [] // Historical doesn't show raw orders
          };
        });
      } else if (tErr) {
        console.error("Tables fetch error:", tErr);
      }
    }

    const pacing = Array.from(pacingMap.values());

    return {
      label: timeframe === 'week' ? "This Week vs Last Week" : "This Month vs Last Month",
      totals: totals,
      aov: totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0,
      pacing: pacing,
      sparklineAov: pacing.map(p => ({ v: p.current_orders > 0 ? Math.round(p.current_revenue / p.current_orders) : 0 })),
      sparklineOrders: pacing.map(p => ({ v: p.current_orders })),
      dishes: finalDishes,
      heatmap: finalHeatmap
    };
  } catch (error) {
    console.error('fetchHistoricalDataFromDB Error:', error);
    return ZERO_STATE;
  }
}

async function fetchTodayData(restaurantId: string, supabase: any) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Fetch raw orders with nested relations
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, total_amount, created_at, table_id,
        tables ( table_number ),
        order_items (
          quantity, price,
          menu_items ( id, name, category, photo_url )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_paid', true)
      .gte('created_at', `${yesterdayStr}T00:00:00Z`);

    if (error) {
      console.error('Today Query Error:', error);
      return ZERO_STATE;
    }

    if (!orders || orders.length === 0) return { ...ZERO_STATE, label: "Today vs Yesterday" };

    // 1. Totals
    let currentRev = 0, prevRev = 0, currentOrd = 0, prevOrd = 0;
    let currentSessions = new Set(), prevSessions = new Set();
    
    // 2. Pacing (24 hours)
    const hourlyPacing: Record<number, any> = {};
    const hourlyCurTurns: Record<number, Set<string>> = {};
    const hourlyPrevTurns: Record<number, Set<string>> = {};
    for (let i = 0; i <= 23; i++) {
      hourlyPacing[i] = { time: `${i === 0 ? 12 : i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`, current_revenue: 0, previous_revenue: 0, current_orders: 0, previous_orders: 0, current_turns: 0, previous_turns: 0 };
      hourlyCurTurns[i] = new Set();
      hourlyPrevTurns[i] = new Set();
    }

    // 3. Dishes & Heatmap Maps
    const dishMap = new Map();
    const tableMap = new Map();

    orders.forEach((o: any) => {
      const isToday = o.created_at.startsWith(todayStr);
      const hour = new Date(o.created_at).getHours();
      
      if (isToday) {
        currentRev += o.total_amount;
        currentOrd++;
        if (o.table_id) {
          currentSessions.add(`${o.table_id}-${todayStr}`);
          // Heatmap Tracking
          if (!tableMap.has(o.table_id)) {
            tableMap.set(o.table_id, { id: o.tables?.table_number || '?', turns: 0, revenue: 0, orders: [] });
          }
          const t = tableMap.get(o.table_id);
          t.turns++;
          t.revenue += o.total_amount;
          
          const itemsList = o.order_items ? o.order_items.map((oi: any) => ({
            name: oi.menu_items?.name || 'Unknown',
            qty: oi.quantity
          })) : [];

          t.orders.push({ 
            id: o.id.substring(0,6), 
            amount: o.total_amount, 
            items_count: o.order_items?.length || 0, 
            time: o.created_at,
            items_list: itemsList
          });
        }
        hourlyPacing[hour].current_revenue += o.total_amount;
        hourlyPacing[hour].current_orders++;
        if (o.table_id) hourlyCurTurns[hour].add(o.table_id);
      } else {
        prevRev += o.total_amount;
        prevOrd++;
        if (o.table_id) prevSessions.add(`${o.table_id}-${yesterdayStr}`);
        hourlyPacing[hour].previous_revenue += o.total_amount;
        hourlyPacing[hour].previous_orders++;
        if (o.table_id) hourlyPrevTurns[hour].add(o.table_id);
      }

      // Dish Tracking
      if (o.order_items) {
        o.order_items.forEach((oi: any) => {
          if (!oi.menu_items) return;
          const m = oi.menu_items;
          if (!dishMap.has(m.id)) {
            dishMap.set(m.id, {
              id: m.id, name: m.name, category: m.category, image: m.photo_url, price: oi.price,
              qty: 0, revenue: 0, hourlyCur: {}, hourlyPrev: {}
            });
          }
          const d = dishMap.get(m.id);
          if (isToday) {
            d.qty += oi.quantity;
            d.revenue += (oi.price * oi.quantity);
            d.hourlyCur[hour] = (d.hourlyCur[hour] || 0) + oi.quantity;
          } else {
            d.hourlyPrev[hour] = (d.hourlyPrev[hour] || 0) + oi.quantity;
          }
        });
      }
    });

    const aov = currentOrd > 0 ? Math.round(currentRev / currentOrd) : 0;
    
    for (let i = 0; i <= 23; i++) {
      hourlyPacing[i].current_turns = hourlyCurTurns[i].size;
      hourlyPacing[i].previous_turns = hourlyPrevTurns[i].size;
    }
    const pacingArray = Object.values(hourlyPacing);

    // Format Dishes
    const dishes = Array.from(dishMap.values())
      .filter(d => d.qty > 0) // Only show dishes sold today
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(d => {
        // Build sparkline (just current qty over 24h)
        const sparkline = [];
        const comparative = [];
        for (let i = Math.max(0, new Date().getHours() - 6); i <= new Date().getHours(); i++) {
           sparkline.push({ v: d.hourlyCur[i] || 0 });
           comparative.push({ time: `${i}h`, cur: d.hourlyCur[i] || 0, prev: d.hourlyPrev[i] || 0 });
        }
        return {
          id: d.id, name: d.name, category: d.category, price: d.price, qty: d.qty, revenue: d.revenue, image: d.image,
          revContrib: currentRev > 0 ? Math.round((d.revenue / currentRev) * 100) : 0,
          prepDelay: '12m', // static for now
          sparkline,
          comparative
        };
      });

    // Format Heatmap
    const heatmap = Array.from(tableMap.values()).map(t => ({
      id: t.id, turns: t.turns, revenue: t.revenue, turnover: '45m',
      status: t.revenue > 2000 ? 'optimal' : t.revenue > 1000 ? 'high' : t.revenue > 500 ? 'medium' : 'low',
      recent_orders: t.orders.sort((a:any, b:any) => new Date(b.time).getTime() - new Date(a.time).getTime())
    }));

    return {
      label: "Today vs Yesterday",
      totals: { revenue: currentRev, prevRevenue: prevRev, orders: currentOrd, prevOrders: prevOrd, turns: currentSessions.size, prevTurns: prevSessions.size },
      aov,
      pacing: pacingArray,
      sparklineAov: [{ v: aov }],
      sparklineOrders: [{ v: currentOrd }],
      dishes,
      heatmap
    };

  } catch (error) {
    console.error('fetchTodayData Error:', error);
    return ZERO_STATE;
  }
}
