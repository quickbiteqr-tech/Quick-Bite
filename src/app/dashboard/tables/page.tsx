'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTables } from '@/lib/hooks/useTables';
import QrCodeDisplay from '@/components/tables/QrCodeDisplay';
import { Plus, Trash2, Edit, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import QRModal from '@/components/QRModal';

type TableItem = {
  id: string | number;
  table_number: string | number;
  qr_code_url?: string | null;
  [key: string]: any; 
};

export default function TablesPage() {
  const { tables, loading, error, deleteTable } = useTables();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTableForModal, setSelectedTableForModal] = useState<TableItem | null>(null);

  const filteredTables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => t.table_number.toLowerCase().includes(q));
  }, [tables, searchQuery]);

  const handleDownloadQR = async (downloadUrl: string, tableNumber: string) => {
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `table-${tableNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download the QR code.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">Tables</p>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Table management
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
                Create tables and print a QR for each so guests can open your menu instantly.
              </p>
            </div>
            <Link
              href="/dashboard/tables/add"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6DBE45] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,190,69,0.25)] transition-all hover:bg-[#5aa337] sm:px-6"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              Add table
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {/* Toolbar: search + count */}
        <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="table-search" className="sr-only">
                Search tables
              </label>
              <input
                id="table-search"
                type="search"
                placeholder="Search by table name or number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#6DBE45] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold tabular-nums text-slate-900">{tables.length}</span>
              <span className="text-slate-400">{tables.length === 1 ? 'table' : 'tables'}</span>
            </span>
          </div>
        </div>

        <section aria-labelledby="tables-list-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h2 id="tables-list-heading" className="text-sm font-semibold text-slate-800">
              QR codes
            </h2>
            <p className="text-xs text-slate-500">
              {filteredTables.length === tables.length ? (
                <span>
                  <span className="font-medium text-slate-700">{tables.length}</span> total
                </span>
              ) : (
                <>
                  Showing <span className="font-medium text-slate-700">{filteredTables.length}</span> of{' '}
                  <span className="font-medium text-slate-700">{tables.length}</span>
                </>
              )}
            </p>
          </div>

          {loading ? (
            // Localised Loading State
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-[#6DBE45]" aria-hidden />
              <p className="mt-4 text-sm text-slate-500">Loading tables…</p>
            </div>
          ) :filteredTables.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#6DBE45]/25 bg-[#6DBE45]/10 px-4 py-10 text-center sm:py-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#6DBE45]/20 bg-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6DBE45]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {tables.length === 0 ? 'No tables yet' : 'No results'}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600 sm:text-sm">
                {tables.length === 0
                  ? 'Add a table to generate its QR code.'
                  : searchQuery
                    ? 'Try another search or clear the filter.'
                    : ''}
              </p>
              {tables.length === 0 && (
                <Link
                  href="/dashboard/tables/add"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6DBE45] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#5aa337] sm:text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add table
                </Link>
              )}
              {tables.length > 0 && searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs font-semibold text-[#6DBE45] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-3 text-center text-sm font-bold text-slate-900 sm:text-base">
                    {table.table_number}
                  </h3>
                  {/* QR Image Display */}
                  {table.qr_code_url && table.qr_code_url !== 'generating...' ? (
                    <div className="flex flex-col items-center">
                      <QrCodeDisplay url={table.qr_code_url} tableName={table.table_number} />
                      
                      {/* View & Download Buttons for QR */}
                      <div className="mt-3 grid w-full grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTableForModal(table)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQR(table.qr_code_url as string, table.table_number)}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#6DBE45]/10 py-2 text-xs font-semibold text-[#6DBE45] transition-colors hover:bg-[#6DBE45] hover:text-white"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center text-slate-400">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#6DBE45]" />
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <Link
                      href={`/dashboard/tables/${table.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#6DBE45] transition-colors hover:text-[#5aa337] sm:text-sm"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteTable(table.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition-colors hover:text-red-700 sm:text-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <QRModal 
        isOpen={!!selectedTableForModal} 
        onClose={() => setSelectedTableForModal(null)} 
        qrUrl={selectedTableForModal?.qr_code_url || ''} 
        tableNumber={Number(selectedTableForModal?.table_number)} 
      />
    </div>
  );
}
