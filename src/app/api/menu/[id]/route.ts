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
    if (!parsedId) {
      return NextResponse.json({ error: "Invalid menu item ID" }, { status: 400 });
    }
    
    // Authorization check
    const isOwner = await verifyOwnership(supabase, parsedId);
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Build update object for menu_items
    const updateData: {
      name?: string;
      description?: string | null;
      price?: number;
      category?: string | null;
      available?: boolean;
      photo_url?: string | null;
      is_veg?: boolean;
      dietary_tags?: string[];
    } = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.category !== undefined) updateData.category = String(body.category || "").trim().toLowerCase();
    if (body.available !== undefined) updateData.available = body.available;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url || null;
    if (body.is_veg !== undefined) updateData.is_veg = body.is_veg;
    if (body.dietary_tags !== undefined) {
      updateData.dietary_tags = body.dietary_tags;
      // Keep is_veg in sync for backwards compat
      if (body.dietary_tags.includes('veg')) updateData.is_veg = true;
      if (body.dietary_tags.includes('non_veg')) updateData.is_veg = false;
    }

    // Update base menu_item
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", parsedId)
      .select()
      .single();

    if (menuError) {
      return NextResponse.json({ error: menuError.message }, { status: 400 });
    }

    // Transactional-ish replacement of relations (Delete Old -> Insert New)
    try {
      if (body.variants !== undefined) {
        await supabase.from("menu_item_variants").delete().eq("menu_item_id", parsedId);
        
        if (body.variants.length > 0) {
          const variantPayload = body.variants.map((v: any, index: number) => ({
            menu_item_id: parsedId,
            label: v.label,
            price: parseFloat(v.price) || 0,
            sort_order: index,
          }));
          const { error: variantError } = await supabase.from("menu_item_variants").insert(variantPayload);
          if (variantError) throw new Error("Failed to update variants: " + variantError.message);
        }
      }

      if (body.modifier_groups !== undefined) {
        // Since ON DELETE CASCADE is set for modifier_options, deleting groups deletes their options
        await supabase.from("modifier_groups").delete().eq("menu_item_id", parsedId);

        if (body.modifier_groups.length > 0) {
          for (let i = 0; i < body.modifier_groups.length; i++) {
            const group = body.modifier_groups[i];
            const { data: groupData, error: groupError } = await supabase
              .from("modifier_groups")
              .insert({
                menu_item_id: parsedId,
                name: group.name,
                min_selection: group.min_selection || 0,
                max_selection: group.max_selection || 1,
                is_required: group.is_required || false,
                sort_order: i,
              })
              .select()
              .single();

            if (groupError) throw new Error("Failed to insert modifier group: " + groupError.message);

            if (group.options && group.options.length > 0) {
              const optionsPayload = group.options.map((opt: any, optIndex: number) => ({
                modifier_group_id: groupData.id,
                name: opt.name,
                price: parseFloat(opt.price) || 0,
                sort_order: optIndex,
              }));
              const { error: optionsError } = await supabase.from("modifier_options").insert(optionsPayload);
              if (optionsError) throw new Error("Failed to insert modifier options: " + optionsError.message);
            }
          }
        }
      }
    } catch (relationError: any) {
      // If relations fail, the base item was still updated, but relations might be incomplete
      return NextResponse.json({ error: relationError.message }, { status: 400 });
    }

    // Fetch the fully hydrated item
    const { data: finalItem } = await supabase
      .from("menu_items")
      .select(`
        *,
        variants:menu_item_variants(*),
        modifier_groups:modifier_groups(
          *,
          options:modifier_options(*)
        )
      `)
      .eq("id", parsedId)
      .single();

    return NextResponse.json(finalItem || menuItem);
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