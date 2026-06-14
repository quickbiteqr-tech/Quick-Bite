// src/app/dashboard/tables/[id]/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Table {
  id: string;
  table_number: string;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#6DBE45] focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20 sm:text-base';

export default function EditTablePage() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.id as string;

  const [table, setTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!tableId) return;

    const fetchTable = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('tables').select('id, table_number').eq('id', tableId).single();

      if (error || !data) {
        toast.error('Could not find the specified table.');
        router.push('/dashboard/tables');
      } else {
        setTable(data as Table);
        setTableNumber(data.table_number);
      }
      setLoading(false);
    };

    fetchTable();
  }, [tableId, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      toast.error('Table name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tables').update({ table_number: tableNumber }).eq('id', tableId);

      if (error) throw error;

      toast.success('Table updated successfully!');
      router.push('/dashboard/tables');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      toast.error(`Update failed: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#6DBE45]" aria-hidden />
      </div>
    );
  }

  if (!table) return null;

  return (
    <div className="mx-auto max-w-lg font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#6DBE45]/40 hover:text-[#6DBE45]"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">Edit</p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">Edit table</h1>
            <p className="mt-1 truncate text-sm text-slate-500">{table.table_number}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <label htmlFor="tableIdentifier" className="mb-2 block text-sm font-semibold text-slate-800">
            Table name or number <span className="text-red-500">*</span>
          </label>
          <input
            id="tableIdentifier"
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className={inputClass}
            placeholder="e.g. 12 or Patio 4"
            required
          />
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-[#6DBE45] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,190,69,0.25)] transition-all hover:bg-[#5aa337] disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
