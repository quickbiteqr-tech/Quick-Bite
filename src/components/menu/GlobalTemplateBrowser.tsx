import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Loader2, X, ImageIcon, BookOpen } from 'lucide-react';
import type { GlobalMenuItem } from '@/components/admin/types';

interface GlobalTemplateBrowserProps {
  onSelect: (item: GlobalMenuItem) => void;
  onClose: () => void;
}

export default function GlobalTemplateBrowser({ onSelect, onClose }: GlobalTemplateBrowserProps) {
  const [items, setItems] = useState<GlobalMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('global_menu_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data as GlobalMenuItem[]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false);
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesInUse = [...new Set(items.map((i) => i.category))].sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-[#6DBE45]" />
              Browse Global Templates
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a pre-configured template to automatically fill your menu item details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#6DBE45] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 transition-colors focus:border-[#6DBE45] focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20 sm:w-48"
          >
            <option value="">All Categories</option>
            {categoriesInUse.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#6DBE45]" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white">
              <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-base font-semibold text-slate-700">No templates found</p>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-[#6DBE45]/50 hover:shadow-md"
                  onClick={() => onSelect(item)}
                >
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-1 font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
                      {item.description || 'No description available.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {item.price ? `₹${item.price}` : 'Free'}
                      </span>
                      <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors group-hover:bg-[#6DBE45] group-hover:text-white">
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
