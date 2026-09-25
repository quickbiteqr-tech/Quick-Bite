import { cookies } from 'next/headers';
import CustomerMenuClient from '@/app/(customer-end-pages)/PublicPagesComponents/CustomerMenuClient';
import { AlertTriangle, UtensilsCrossed } from 'lucide-react';
import React from 'react';
import { createServerClient } from '@/lib/supabase/server';

export default async function RestaurantMenuPage({
  params
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params;
  const cookieStore = await cookies();
  
  const sessionCookie = cookieStore.get('qb_session')?.value;
  const contextCookie = cookieStore.get('qb_table_context')?.value;

  let isSessionValid = false;
  let tableContext: { restaurantId?: string; tableNumber?: string; tableId?: string } = {};

  if (sessionCookie && contextCookie) {
    try {
      const decoded = Buffer.from(contextCookie, 'base64').toString('utf-8');
      tableContext = JSON.parse(decoded);
      
      // Hit the database to strictly verify if session is revoked/expired and check if table is locked
      if (tableContext.restaurantId && tableContext.tableNumber) {
        const supabase = await createServerClient();
        const { data: sessionData } = await supabase
          .from('diner_sessions')
          .select('revoked, expires_at')
          .eq('id', sessionCookie)
          .single();
          
        if (sessionData) {
          if (!sessionData.revoked && new Date(sessionData.expires_at) > new Date()) {
            isSessionValid = true;
          }
        } else {
          isSessionValid = true;
        }

        if (tableContext.tableId) {
          const { data: tableData } = await supabase
            .from('tables')
            .select('is_locked')
            .eq('id', tableContext.tableId)
            .single();
            
          if (tableData?.is_locked) {
            return (
              <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center selection:bg-[#6DBE45] selection:text-white">
                <UtensilsCrossed className="mb-4 h-16 w-16 text-slate-300" strokeWidth={1.5} />
                <h1 className="mb-2 text-xl font-bold text-slate-900">Digital Ordering Paused.</h1>
                <p className="max-w-xs text-sm text-slate-500">
                  Please place your order or request assistance directly with our staff at the counter. Thank you!
                </p>
              </div>
            );
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse qb_table_context cookie', e);
    }
  }

  if (!isSessionValid || !tableContext.restaurantId || !tableContext.tableNumber) {
    // If the session is totally invalid/missing, we can drop them into a hard error state.
    // Or we can pass isSessionValid=false down to the client so they see Read-Only mode.
    // Let's pass it down so they can still browse the menu in Read-Only mode!
    return (
      <CustomerMenuClient 
        restaurantSlug={restaurantSlug}
        tableNumber={tableContext.tableNumber || 'Unknown'}
        restaurantId={tableContext.restaurantId || ''}
        isSessionValid={false}
        tableId={tableContext.tableId || ''}
        sessionId={sessionCookie || ''}
      />
    );
  }

  return (
    <CustomerMenuClient 
      restaurantSlug={restaurantSlug}
      tableNumber={tableContext.tableNumber as string}
      restaurantId={tableContext.restaurantId as string}
      isSessionValid={isSessionValid}
      tableId={tableContext.tableId as string}
      sessionId={sessionCookie as string}
    />
  );
}