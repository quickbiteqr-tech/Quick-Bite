'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { notifyLocal } from '@/lib/utils/notifications';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function LiveOrderNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ✅ Fetch existing unread notifications
    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (!error && data && mounted) {
        setNotifications(data);
      }
      setLoading(false);
    };

    fetchNotifications();

    // ✅ Realtime subscription for new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (!mounted) return;

          setNotifications((prev) => [newNotif, ...prev]);

          // Fire a local notification in the browser
          notifyLocal('🔔 New Order Update!', newNotif.message);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-5 w-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-800">Notifications</h2>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No new notifications</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-indigo-50 rounded-lg text-sm text-gray-800"
            >
              {n.message}
              <span className="ml-2 text-xs text-gray-500">
                {new Date(n.created_at).toLocaleTimeString()}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
