"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useTables } from '@/lib/hooks/useTables';
import QRCodeGenerator from '@/components/tables/QRCodeGenerator';
import { Plus, Printer, Download, Trash2, Edit, Loader2, Eye, Lock, Unlock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import QRModal from '@/components/QRModal';
import { supabase } from '@/lib/supabase/client';
import { generateQR } from '@/lib/api/generateQR';

type TableItem = {
  id: string;
  table_number: string;
  qr_code_url?: string | null;
  is_locked?: boolean;
  restaurant_id?: string;
  [key: string]: any; 
};

export default function TablesV2Page() {
  const { tables, loading, error, deleteTable, refetch } = useTables();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [selectedTableForModal, setSelectedTableForModal] = useState<TableItem | null>(null);
  
  // Modal states for routing-free flow
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  
  const [formInput, setFormInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch restaurant context for Add/Edit logic
  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single();
      if (data) setRestaurant(data);
    };
    fetchRestaurant();
  }, []);

  // --- ACTIONS ---
  const handleToggleLock = async (tableId: string, currentLockState: boolean) => {
    setActionLoading(`lock-${tableId}`);
    const newLockState = !currentLockState;
    try {
      const res = await fetch(`/api/admin/tables/${tableId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: newLockState }),
      });
      if (res.ok) {
        toast.success(`Table ${newLockState ? 'locked' : 'unlocked'}`);
        refetch();
      } else {
        toast.error('Failed to update table status');
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadQR = (tableId: string, tableNumber: string) => {
    try {
      const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement;
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `table-${tableNumber}-qr.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success(`Downloaded QR for ${tableNumber}`);
      } else {
        toast.error("QR Code not found.");
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download the QR code.");
    }
  };

  const handleBulkPrint = () => {
    toast('Preparing PDF...', {
      icon: <Printer className="w-4 h-4" />,
      description: 'Collating all active tables into a printable PDF layout.',
    });
  };

  // Add Table Logic
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) {
      toast.error('Restaurant data not found.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const num = Number(formInput);
      const response = await generateQR(restaurant.slug, restaurant.id, num);
      if (response && typeof response === 'object' && (response as any).tableId) {
        toast.success(`Table ${num} created successfully!`);
        setIsAddModalOpen(false);
        setFormInput('');
        refetch();
      }
    } catch (error: any) {
      let errMsg = "Failed to generate QR.";
      if (error.message?.includes('already exists')) {
        errMsg = error.message.replace('Failed to generate QR: ', ''); 
      }
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Table Logic
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !restaurant) return;
    
    if (formInput === editingTable.table_number) {
      setIsEditingClosed();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/update-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: editingTable.id,
          newTableNumber: Number(formInput),
          restaurantId: restaurant.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update table');
      }

      toast.success('Table updated & new QR generated!');
      setIsEditingClosed();
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setIsEditingClosed = () => {
    setEditingTable(null);
    setFormInput('');
  };

  // --- FILTERING ---
  const filteredTables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => t.table_number.toLowerCase().includes(q));
  }, [tables, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans flex flex-col pb-24 lg:pb-12 overflow-x-hidden">
      
      {/* --- PREMIUM HEADER & BULK ACTIONS --- */}
      <div className="mb-8 shrink-0 px-4 md:px-6 lg:px-8 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200/60 pb-8 bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
             Print Studio
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
             Manage floor layouts and generate premium tent cards.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={() => { setFormInput(''); setIsAddModalOpen(true); }}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95"
           >
             <Plus size={18} />
             Add table
           </button>
           <button 
             onClick={handleBulkPrint}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#6DBE45] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(109,190,69,0.3)] hover:bg-[#5aa337] hover:shadow-[0_6px_20px_rgba(109,190,69,0.4)] transition-all active:scale-95"
           >
             <Printer size={18} />
             Print All (PDF)
           </button>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 flex flex-col gap-8">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative max-w-sm w-full">
             <input
               type="text"
               placeholder="Search tables (e.g. Table 04)..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all shadow-sm"
             />
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             {filteredTables.length} Tables Found
           </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#6DBE45]" />
            <p className="text-sm font-bold text-slate-400">Loading Floor Plan...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 border-dashed">
            <p className="text-lg font-black text-slate-700">No tables found.</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or add a new table.</p>
          </div>
        ) : (
          /* --- THE TENT CARD GRID --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
             {filteredTables.map(table => {
               const isActive = !table.is_locked;
               const isUpdating = actionLoading === `lock-${table.id}`;

               return (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   key={table.id}
                   className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 overflow-hidden"
                 >
                    {/* Top Status Bar */}
                    <div className={`h-1.5 w-full transition-colors ${isActive ? 'bg-[#6DBE45]' : 'bg-amber-400'}`} />

                    <div className="p-5 flex flex-col items-center relative h-full">
                      {/* Subdued bg watermark */}
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] font-black text-slate-50 pointer-events-none z-0 whitespace-nowrap">
                        {table.table_number.replace('Table', '').trim()}
                      </span>

                      {/* Header */}
                      <h3 className="text-lg font-black text-slate-900 tracking-tight z-10 mb-4">{table.table_number}</h3>

                      {/* QR Display */}
                      <div className={`z-10 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 transition-opacity flex items-center justify-center mb-5 ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        {table.id ? (
                           <QRCodeGenerator tableId={String(table.id)} tableName={String(table.table_number)} size={120} />
                        ) : (
                           <div className="w-[120px] h-[120px] flex items-center justify-center">
                             <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                           </div>
                        )}
                      </div>

                      {/* Primary Actions (View & Download) */}
                      <div className="z-10 w-full grid grid-cols-2 gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedTableForModal(table as unknown as TableItem)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:border-slate-300"
                        >
                          <Eye size={14} /> View QR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQR(String(table.id), String(table.table_number))}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#6DBE45]/10 py-2.5 text-xs font-bold text-[#4A8F2F] transition-colors hover:bg-[#6DBE45] hover:text-white"
                        >
                          <Download size={14} /> Download
                        </button>
                      </div>

                      {/* Secondary Actions Row */}
                      <div className="z-10 w-full mt-4 pt-4 border-t border-slate-100 flex items-center justify-between px-1">
                         <button
                           type="button"
                           onClick={() => handleToggleLock(String(table.id), !!table.is_locked)}
                           disabled={isUpdating}
                           className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${table.is_locked ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           {isUpdating ? <Loader2 size={14} className="animate-spin" /> : (table.is_locked ? <Lock size={14} /> : <Unlock size={14} />)}
                           {table.is_locked ? 'Locked' : 'Unlocked'}
                         </button>
                         
                         <div className="flex items-center gap-4">
                           <button
                             type="button"
                             onClick={() => { setEditingTable(table); setFormInput(table.table_number); }}
                             className="text-slate-400 hover:text-[#6DBE45] transition-colors"
                             title="Edit Table"
                           >
                             <Edit size={16} />
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               if(window.confirm(`Delete ${table.table_number}?`)) deleteTable(String(table.id));
                             }}
                             className="text-slate-400 hover:text-rose-500 transition-colors"
                             title="Delete Table"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                      </div>

                    </div>
                 </motion.div>
               )
             })}
          </div>
        )}
      </div>

      {/* --- VIEW QR MODAL --- */}
      <QRModal 
        isOpen={!!selectedTableForModal} 
        onClose={() => setSelectedTableForModal(null)} 
        tableId={selectedTableForModal?.id} 
        tableName={selectedTableForModal?.table_number} 
      />

      {/* --- ADD / EDIT MODALS --- */}
      <AnimatePresence>
        {(isAddModalOpen || editingTable) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {editingTable ? 'Edit Table' : 'Add New Table'}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {editingTable ? 'Update the table identifier.' : 'Enter a table number to generate a QR.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => editingTable ? setIsEditingClosed() : setIsAddModalOpen(false)} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
               </div>

               <form onSubmit={editingTable ? handleEditSubmit : handleAddSubmit} className="p-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Table Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. 12"
                    value={formInput}
                    onChange={(e) => setFormInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/30 focus:border-[#6DBE45] transition-all"
                  />
                  
                  <div className="mt-8 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => editingTable ? setIsEditingClosed() : setIsAddModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formInput.trim()}
                      className="flex-1 py-3 rounded-xl font-bold text-white bg-[#6DBE45] hover:bg-[#5aa337] transition-colors flex items-center justify-center shadow-md shadow-[#6DBE45]/20 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Save Table'}
                    </button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
