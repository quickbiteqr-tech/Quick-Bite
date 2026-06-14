// src/app/api/orders/enhanced/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return NextResponse.json({ error: "Authentication error: " + userError.message }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the restaurant for this user
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (restaurantError) {
      console.error("Restaurant query error:", restaurantError);
      return NextResponse.json({ 
        error: "Restaurant lookup failed: " + restaurantError.message 
      }, { status: 404 });
    }
    
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found for this user" }, { status: 404 });
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .eq("restaurant_id", restaurant.id);

    if (countError) {
      console.error("[enhanced API] Error counting orders:", countError);
    }

    // Get orders with all related data (paginated)
    // Fetch orders with pagination
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        track_code,
        status,
        total_amount,
        created_at,
        is_prepaid,
        estimated_time,
        table_id,
        restaurant_id,
        tables(id, table_number),
        restaurants(id, restaurant_name, user_id)
      `)
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersError) {
      console.error("[enhanced API] Error fetching orders:", ordersError);
      return NextResponse.json({ 
        error: "Failed to fetch orders: " + ordersError.message 
      }, { status: 500 });
    }

    console.log(`[enhanced API] Found ${orders?.length || 0} orders for restaurant ${restaurant.id}`);

    // Return paginated response even if no orders found (this is valid, not an error)
    if (!orders || orders.length === 0) {
      console.log("[enhanced API] No orders found, returning empty paginated response");
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit) || 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      });
    }

    // For each order, get the items
    const ordersWithItems = [];
    
    for (const order of orders || []) {
      try {
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            quantity,
            price,
            status,
            estimated_time,
            notes,
            created_at,
            updated_at,
            menu_item:menu_items(id, name, description, photo_url)
          `)
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        // Always include the order, even if there's an error fetching items
        // Default to empty array if error occurs
        type OrderItemType = {
          id: string;
          quantity: number;
          price: number;
          status: string;
          estimated_time?: number | null;
          notes?: string | null;
          created_at: string;
          updated_at: string;
          menu_item: { id: string; name: string; description?: string | null; photo_url?: string | null } | null;
        };
        
        let validItems: OrderItemType[] = [];
        
        if (itemsError) {
          console.error(`[enhanced API] Error fetching items for order ${order.id}:`, itemsError);
          // Continue with empty items array instead of skipping the order
        } else {
          console.log(`[enhanced API] Order ${order.id} has ${items?.length || 0} items`);
          // Filter out items with null menu_item (in case menu item was deleted)
          // Handle menu_item as array or object (Supabase can return either)
          validItems = (items || []).map((item: {
            id: unknown;
            quantity: unknown;
            price: unknown;
            status: unknown;
            estimated_time?: unknown;
            notes?: unknown;
            created_at: unknown;
            updated_at?: unknown;
            menu_item: unknown;
          }) => {
            // If menu_item is an array, take the first one, otherwise use it as-is
            let menuItem: { id: string; name: string; description?: string | null; photo_url?: string | null } | null = null;
            
            if (item.menu_item) {
              if (Array.isArray(item.menu_item)) {
                const firstItem = item.menu_item[0];
                if (firstItem && typeof firstItem === 'object' && 'id' in firstItem && 'name' in firstItem) {
                  menuItem = {
                    id: String(firstItem.id),
                    name: String(firstItem.name),
                    description: firstItem.description ? String(firstItem.description) : null,
                    photo_url: firstItem.photo_url ? String(firstItem.photo_url) : null,
                  };
                }
              } else if (typeof item.menu_item === 'object' && item.menu_item !== null && 'id' in item.menu_item && 'name' in item.menu_item) {
                const menuItemObj = item.menu_item as { id: unknown; name: unknown; description?: unknown; photo_url?: unknown };
                menuItem = {
                  id: String(menuItemObj.id),
                  name: String(menuItemObj.name),
                  description: menuItemObj.description ? String(menuItemObj.description) : null,
                  photo_url: menuItemObj.photo_url ? String(menuItemObj.photo_url) : null,
                };
              }
            }
            
            return {
              id: String(item.id),
              quantity: Number(item.quantity) || 0,
              price: Number(item.price) || 0,
              status: String(item.status || 'pending'),
              estimated_time: item.estimated_time != null ? Number(item.estimated_time) : null,
              notes: item.notes != null ? String(item.notes) : null,
              created_at: String(item.created_at),
              updated_at: item.updated_at != null ? String(item.updated_at) : String(item.created_at),
              menu_item: menuItem,
            } as OrderItemType;
          }).filter((item: OrderItemType) => item.menu_item != null);
        }

        // Calculate order statistics
        const totalItems = validItems.length;
        const statusCounts = validItems.reduce((acc: Record<string, number>, item: { status: string }) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});

        const orderStats = {
          totalItems,
          statusCounts,
          allItemsReady: validItems.every((item: { status: string }) => item.status === "ready" || item.status === "served") || false,
          allItemsServed: validItems.every((item: { status: string }) => item.status === "served") || false,
          hasPreparingItems: validItems.some((item: { status: string }) => item.status === "preparing") || false,
        };

        // Handle restaurant data (Supabase returns as object or array)
        let restaurantData: { id: string; restaurant_name: string } = { id: '', restaurant_name: '' };
        if (order.restaurants) {
          if (Array.isArray(order.restaurants) && order.restaurants.length > 0) {
            restaurantData = order.restaurants[0];
          } else if (typeof order.restaurants === 'object' && order.restaurants !== null && !Array.isArray(order.restaurants)) {
            restaurantData = order.restaurants as { id: string; restaurant_name: string };
          }
        }

        // Handle table data (Supabase returns as object or array)
        let tableData: { table_number: string } | null = null;
        if (order.tables) {
          if (Array.isArray(order.tables) && order.tables.length > 0) {
            tableData = order.tables[0];
          } else if (typeof order.tables === 'object' && order.tables !== null && !Array.isArray(order.tables)) {
            tableData = order.tables as { table_number: string };
          }
        }

        // Include orders even if they have no items
        ordersWithItems.push({
          order: {
            id: order.id,
            track_code: order.track_code || '',
            status: order.status || 'pending',
            total_amount: order.total_amount || 0,
            created_at: order.created_at,
            is_prepaid: order.is_prepaid || false,
            estimated_time: order.estimated_time || null,
            table_id: order.table_id || null,
            restaurant_id: order.restaurant_id || restaurant.id,
            table: tableData,
            restaurant: restaurantData,
          },
          items: validItems,
          stats: orderStats,
        });
      } catch (error) {
        console.error(`[enhanced API] Error processing order ${order.id}:`, error);
        // Include order with minimal data even if processing fails
        try {
          ordersWithItems.push({
            order: {
              id: order.id,
              track_code: order.track_code || '',
              status: order.status || 'pending',
              total_amount: order.total_amount || 0,
              created_at: order.created_at || new Date().toISOString(),
              is_prepaid: order.is_prepaid || false,
              estimated_time: order.estimated_time || null,
              table_id: order.table_id || null,
              restaurant_id: order.restaurant_id || restaurant.id,
              table: null,
              restaurant: { id: restaurant.id, restaurant_name: '' },
            },
            items: [],
            stats: {
              totalItems: 0,
              statusCounts: {},
              allItemsReady: false,
              allItemsServed: false,
              hasPreparingItems: false,
            },
          });
        } catch (fallbackError) {
          console.error(`[enhanced API] Failed to add order ${order.id} even with fallback:`, fallbackError);
        }
      }
    }

    console.log(`[enhanced API] Returning ${ordersWithItems.length} orders with items`);
    
    // Return paginated response with metadata
    return NextResponse.json({
      data: ordersWithItems,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNextPage: offset + limit < (totalCount || 0),
        hasPreviousPage: page > 1,
      }
    });
  } catch (error) {
    console.error("Enhanced orders API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: "Internal server error: " + errorMessage 
    }, { status: 500 });
  }
}
