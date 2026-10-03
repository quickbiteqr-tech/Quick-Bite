'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function getMessages() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data || [];
}

export async function getUnreadCount() {
  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
  return count || 0;
}

export async function markAsRead(id: string) {
  const supabase = await createServerClient();
  await supabase.from('contact_messages').update({ status: 'read' }).eq('id', id);
  return true;
}

export async function archiveMessage(id: string) {
  const supabase = await createServerClient();
  await supabase.from('contact_messages').update({ status: 'archived' }).eq('id', id);
  return true;
}
