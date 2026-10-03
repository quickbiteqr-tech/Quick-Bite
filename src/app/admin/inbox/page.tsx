'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Archive, Clock, Search, Inbox as InboxIcon } from 'lucide-react';
import { getMessages, markAsRead, archiveMessage, getUnreadCount } from '@/app/actions/inbox';

const intentColors = {
  demo: 'bg-purple-100 text-purple-700 border-purple-200',
  partnership: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  support: 'bg-blue-100 text-blue-700 border-blue-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function InboxPage() {
  const { data: messages = [], mutate: mutateMessages } = useSWR('admin_messages', getMessages);
  const { mutate: mutateUnread } = useSWR('admin_unread_count', getUnreadCount);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedMessage = messages.find((m: any) => m.id === selectedId);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    const msg = messages.find((m: any) => m.id === id);
    
    if (msg?.status === 'unread') {
      // Optimistic UI updates
      mutateMessages(messages.map((m: any) => m.id === id ? { ...m, status: 'read' } : m), false);
      mutateUnread((count: number = 0) => Math.max(0, count - 1), false);
      
      // Background server update
      await markAsRead(id);
      mutateMessages();
      mutateUnread();
    }
  };

  const handleArchive = async (id: string) => {
    const msg = messages.find((m: any) => m.id === id);
    
    // Optimistic UI updates
    mutateMessages(messages.filter((m: any) => m.id !== id), false);
    if (msg?.status === 'unread') {
      mutateUnread((count: number = 0) => Math.max(0, count - 1), false);
    }
    setSelectedId(null);
    
    // Background server update
    await archiveMessage(id);
    mutateMessages();
    mutateUnread();
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.24))] max-h-[850px] flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* LEFT PANE (Feed) */}
      <div className="w-[30%] min-w-[300px] border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-200 transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No messages found.</div>
          ) : (
            messages.map((msg: any) => (
              <div 
                key={msg.id}
                onClick={() => handleSelect(msg.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative ${
                  selectedId === msg.id ? 'bg-blue-50/50' : 'hover:bg-slate-100/50'
                }`}
              >
                {msg.status === 'unread' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm truncate pr-2 ${msg.status === 'unread' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {msg.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-xs truncate ${msg.status === 'unread' ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                  {msg.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE (Canvas) */}
      <div className="flex-1 bg-white flex flex-col relative">
        {!selectedMessage ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <InboxIcon className="w-16 h-16 mb-4 text-slate-200" strokeWidth={1} />
            <p className="text-sm font-medium">Select a message to read</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedMessage.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    {selectedMessage.email}
                  </a>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${(intentColors as any)[selectedMessage.intent.toLowerCase()] || intentColors.other}`}>
                    {selectedMessage.intent}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.intent} Inquiry`}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
                  title="Reply via Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => handleArchive(selectedMessage.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                  title="Archive Message"
                >
                  <Archive className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <Clock className="w-4 h-4" />
                Received {new Date(selectedMessage.created_at).toLocaleString()}
              </div>
              <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>
          </>
        )}
      </div>
      
    </div>
  );
}
