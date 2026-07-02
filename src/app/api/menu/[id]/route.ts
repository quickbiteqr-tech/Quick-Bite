import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function parseMenuItemId(rawId: string): string | null {
  // Check if it's a valid UUID format using a regular expression
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!rawId || !uuidRegex.test(rawId)) {
    return null;
  }
  
  return rawId;
}

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  menuItemId: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: menuItem, error } = await supabase
    .from("menu_items")
    .select("restaurant_id")
    .eq("id", menuItemId)
    .single();
  if (error || !menuItem) {
    console.error("Error verifying ownership:", error);
    return false;
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!restaurant) {
    console.error("Restaurant not found for user");
    return false;
  }

  return menuItem.restaurant_id === restaurant.id;
}


// GET one menu item (no auth needed for public viewing, but can be added if required)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });
    }
    const parsedId = parseMenuItemId(id);
    if (!parsedId) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", parsedId)
      .single();

    if (error) {
      console.error("GET menu item error:", error);
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET menu item unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching the menu item." },
      { status: 500 }
    );
  }
}

// UPDATE one menu item
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });
    }
    const parsedId = parseMenuItemId(id);
    console.log("Menu Id", id);
    console.log("Parsed Menu Id", parsedId);
    if (!parsedId) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 });
    }
    
    // Authorization check
    const isOwner = await verifyOwnership(supabase, parsedId);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ID is UUID (string), no conversion needed
    console.log("PUT request received for menu item ID:", id);
    let body;
    try {
      body = await req.json();
      console.log("PUT request body:", body);
    } catch (parseError) {
      console.error("PUT request body parse error:", parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Strip immutable/non-existent fields defensively from any stale client payload.
    if (body && typeof body === "object") {
      delete body.updated_at;
      delete body.created_at;
      delete body.id;
      delete body.restaurant_id;
    }

    // Validate required fields only if they're being updated
    // For partial updates (like setting available: false), we don't need name/price
    // Only validate if name or price are explicitly provided in the request
    if (body.name !== undefined && !body.name) {
      console.log("Validation failed: Name cannot be empty");
      return NextResponse.json(
        { error: "Name cannot be empty if provided" },
        { status: 400 }
      );
    }
    if (body.price !== undefined && (body.price === null || body.price < 0)) {
      console.log("Validation failed: Price must be valid");
      return NextResponse.json(
        { error: "Price must be a valid positive number if provided" },
        { status: 400 }
      );
    }

    // Build update object - only include fields that are provided
    const updateData: {
      name?: string;
      description?: string | null;
      price?: number;
      category?: string | null;
      available?: boolean;
      photo_url?: string | null;
      is_veg?: boolean;
    } = {};
    
    // Only update fields that are explicitly provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.category !== undefined) {
      const normalizedCategory = String(body.category || "").trim().toLowerCase();
      updateData.category = normalizedCategory;
    }
    if (body.available !== undefined) updateData.available = body.available;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url || null;
    if (body.is_veg !== undefined) updateData.is_veg = body.is_veg;


    const { data, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", parsedId)
      .select()
      .single();

    if (error) {
      console.error("❌ PUT menu item Supabase error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Update query was:", { id: parsedId, updateData });
      
      // Return more detailed error message
      let errorMessage = error.message || "Failed to update menu item";
      if (error.code) {
        errorMessage = `${errorMessage} (Code: ${error.code})`;
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        code: error.code,
        details: error.details || null
      }, { status: 400 });
    }


    if (!data) {
      return NextResponse.json({ error: "Menu item not found or update failed" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PUT menu item unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the menu item." },
      { status: 500 }
    );
  }
}

// DELETE one menu item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== DELETE MENU ITEM START ===");
    const supabase = await createServerClient();
    const { id } = await params;
    console.log("Menu item ID received:", id, "Type:", typeof id);

    if (!id) {
      console.log("ERROR: No ID provided");
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });
    }
    const parsedId = parseMenuItemId(id);
    if (!parsedId) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 });
    }

    // Authorization check - verify ownership first
    console.log("Checking ownership...");
    const isOwner = await verifyOwnership(supabase, parsedId);
    console.log("Ownership check result:", isOwner);
    if (!isOwner) {
      console.log("ERROR: Unauthorized - user doesn't own this menu item");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get restaurant ID for the database function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("ERROR: No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("User ID:", user.id);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (restaurantError) {
      console.error("Restaurant fetch error:", restaurantError);
    }
    console.log("Restaurant ID:", restaurant?.id);

    if (!restaurant) {
      console.log("ERROR: Restaurant not found");
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // First, verify the menu item exists and get its ID type
    console.log("Fetching menu item from database...");
    const { data: menuItemData, error: menuItemError } = await supabase
      .from("menu_items")
      .select("id, restaurant_id")
      .eq("id", parsedId)
      .single();

    if (menuItemError) {
      console.error("Menu item fetch error:", menuItemError);
      console.error("Error details:", JSON.stringify(menuItemError, null, 2));
    }
    console.log("Menu item data:", menuItemData);
    console.log("Menu item ID from DB:", menuItemData?.id, "Type:", typeof menuItemData?.id);

    if (menuItemError || !menuItemData) {
      console.log("ERROR: Menu item not found in database");
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Check if menu item is used in any orders before deletion
    // The menu_item column in order_items references menu_items.id
    // Try checking with the actual ID from the database
    console.log("Checking order_items table for menu_item:", menuItemData.id);
    console.log("Menu item ID type from DB:", typeof menuItemData.id);
    
    interface OrderItem {
      id: string;
      order_id: string;
      menu_item: string | number;
    }
    const { data: uniqueOrderItemsRaw, error: orderItemsError } = await supabase
      .from("order_items")
      .select("id, order_id, menu_item")
      .eq("menu_item", parsedId)
      .limit(20);
    if (orderItemsError) {
      console.error("Error checking order_items references:", orderItemsError);
    }
    const uniqueOrderItems = uniqueOrderItemsRaw ?? [];
    
    console.log("Total unique order items found:", uniqueOrderItems.length);
    console.log("Order items details:", uniqueOrderItems);

    const foundInOrders = uniqueOrderItems.length > 0;

    console.log("Found in orders check result:", {
      uniqueOrderItemsCount: uniqueOrderItems.length,
      foundInOrders
    });

    if (foundInOrders) {
      console.log("⚠️ Menu item is referenced by orders, applying soft delete (available=false)");
      const { data: softDeleted, error: softDeleteError } = await supabase
        .from("menu_items")
        .update({ available: false })
        .eq("id", parsedId)
        .eq("restaurant_id", restaurant.id)
        .select()
        .single();

      if (softDeleteError) {
        console.error("Soft delete fallback failed:", softDeleteError);
        return NextResponse.json(
          { error: "Item is used in orders and could not be marked unavailable." },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        deleted: false,
        softDeleted: true,
        message: "Item is used in existing orders, so it was marked unavailable instead.",
        item: softDeleted,
      });
    }

    console.log("✅ No order items found - proceeding with deletion");

    // Direct delete
    console.log("Deleting menu item directly...");
    console.log("Delete parameters:", { id, restaurant_id: restaurant.id });
    const { data: deleteData, error: deleteError } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", parsedId)
      .eq("restaurant_id", restaurant.id) // Extra safety check
      .select();

    if (deleteError) {
      console.error("❌ Direct delete error:", deleteError);
      console.error("Delete error details:", JSON.stringify(deleteError, null, 2));
      const errorMessage = deleteError.message || String(deleteError);
      console.error("Error message:", errorMessage);
      
      // Check if it's a foreign key constraint error
      const isForeignKeyError = 
        errorMessage.includes("foreign key constraint") || 
        errorMessage.includes("fkey") ||
        errorMessage.includes("violates foreign key") ||
        errorMessage.includes("order_items_menu_item_fkey") ||
        errorMessage.includes("violates foreign key constraint");
      
      console.log("Is foreign key error?", isForeignKeyError);
      
      if (isForeignKeyError) {
        console.log("⚠️ BLOCKING DELETION: Foreign key constraint detected from direct delete");
        console.log("=== DELETE MENU ITEM END (FK ERROR FROM DIRECT DELETE) ===");
        return NextResponse.json({ 
          error: "Cannot delete this menu item because it is used in existing orders. You can mark it as unavailable instead." 
        }, { status: 409 });
      }
      
      console.log("=== DELETE MENU ITEM END (DELETE ERROR) ===");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify deletion happened
    if (!deleteData || deleteData.length === 0) {
      console.log("⚠️ WARNING: Delete query succeeded but no data returned");
      console.log("=== DELETE MENU ITEM END (NO DATA RETURNED) ===");
      return NextResponse.json({ error: "Menu item not found or already deleted" }, { status: 404 });
    }

    console.log("✅ SUCCESS: Menu item deleted directly");
    console.log("Deleted data:", deleteData);
    console.log("=== DELETE MENU ITEM END (SUCCESS) ===");
    return NextResponse.json({ success: true, deleted: deleteData });
  } catch (err) {
    console.error("❌ CRITICAL ERROR in DELETE menu item catch block:", err);
    console.error("Error type:", err?.constructor?.name);
    console.error("Error stack:", err instanceof Error ? err.stack : 'No stack trace');
    console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error message:", errorMessage);
    
    // Check if it's a foreign key constraint error in the catch block too
    const isForeignKeyError = 
      errorMessage.includes("foreign key constraint") || 
      errorMessage.includes("fkey") ||
      errorMessage.includes("violates foreign key") ||
      errorMessage.includes("order_items_menu_item_fkey") ||
      errorMessage.includes("violates foreign key constraint");
    
    console.log("Is foreign key error in catch?", isForeignKeyError);
    
    if (isForeignKeyError) {
      console.log("⚠️ BLOCKING DELETION: Foreign key constraint detected in catch block");
      console.log("=== DELETE MENU ITEM END (FK ERROR IN CATCH) ===");
      return NextResponse.json({ 
        error: "Cannot delete this menu item because it is used in existing orders. You can mark it as unavailable instead." 
      }, { status: 409 });
    }
    
    console.log("=== DELETE MENU ITEM END (UNEXPECTED ERROR) ===");
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the menu item." },
      { status: 500 }
    );
  }
}