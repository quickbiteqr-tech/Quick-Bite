'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ImageDropzone from '@/components/admin/ImageDropzone';
import type { GlobalMenuItem } from '@/components/admin/types';
import { MENU_CATEGORIES } from '@/components/admin/types';
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  X,
  Search,
  ImageIcon,
} from 'lucide-react';

export default function MenuLibraryPage() {
  // ─── State ───
  const [items, setItems] = useState<GlobalMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(MENU_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search / filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Fetch Items ───
  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('global_menu_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as GlobalMenuItem[]) ?? []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load menu library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Filtered Items ───
  const filteredItems = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false);
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ─── Submit Handler ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Dish name is required.');
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;

    try {
      // 1. Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('global-menu')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('global-menu')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Insert into database
      const { error: insertError } = await supabase
        .from('global_menu_library')
        .insert({
          name: name.trim(),
          category,
          description: description.trim() || null,
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      toast.success(`"${name.trim()}" added to the library!`);

      // Reset form
      setName('');
      setCategory(MENU_CATEGORIES[0]);
      setDescription('');
      setImageFile(null);
      setShowForm(false);

      // Refresh list
      await fetchItems();
    } catch (err: unknown) {
      console.error('Submit error:', err);
      const message = err instanceof Error ? err.message : 'Failed to add item.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Handler ───
  const handleDelete = async (item: GlobalMenuItem) => {
    if (!confirm(`Delete "${item.name}" from the library? This cannot be undone.`)) return;

    setDeletingId(item.id);
    try {
      // Delete image from storage if it exists
      if (item.image_url) {
        try {
          const url = new URL(item.image_url);
          const pathSegments = url.pathname.split('/global-menu/');
          if (pathSegments[1]) {
            await supabase.storage.from('global-menu').remove([pathSegments[1]]);
          }
        } catch {
          // Storage delete failure is non-critical
        }
      }

      const { error } = await supabase
        .from('global_menu_library')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`"${item.name}" deleted.`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete item.');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Unique categories in data ───
  const categoriesInUse = [...new Set(items.map((i) => i.category))].sort();

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">
            <BookOpen className="h-4 w-4" />
            Menu Library
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Global Menu Library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload dishes that restaurants can browse and add to their menus.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add item'}
        </button>
      </div>

      {/* ── Add Item Form ── */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-slate-800">New menu item</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Left: fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="dish-name" className="mb-1 block text-xs font-semibold text-slate-600">
                    Dish Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="dish-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Paneer Tikka"
                    required
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="dish-category" className="mb-1 block text-xs font-semibold text-slate-600">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="dish-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {MENU_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="dish-description" className="mb-1 block text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <textarea
                    id="dish-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A short description of the dish…"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
              </div>

              {/* Right: image upload */}
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">Dish Image</p>
                <ImageDropzone
                  onFileSelect={(file) => setImageFile(file)}
                  onClear={() => setImageFile(null)}
                  isUploading={submitting}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to Library
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">All categories</option>
          {categoriesInUse.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="shrink-0 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{filteredItems.length}</span> items
        </span>
      </div>

      {/* ── Items Table / Grid ── */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {items.length === 0 ? 'No items in the library yet' : 'No matching items'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {items.length === 0
              ? 'Click "Add item" to upload your first dish.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Image</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Added</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                      {item.description || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-px sm:hidden">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
