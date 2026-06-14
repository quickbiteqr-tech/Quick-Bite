// src/app/dashboard/menu/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMenuItems } from '@/lib/hooks/useMenuItems';
import { MenuItem } from '@/types/menu';
import MenuItemCard from '@/components/menu/MenuItemCard';
import DeleteConfirmation from '@/components/menu/DeleteConfirmation';
import { toast } from 'sonner';
import { createMenuCategory, deleteMenuCategory, getMenuCategories, updateMenuCategory } from '@/lib/api/menuCategories';

export default function MenuPage() {
    const { menuItems, loading, error, deleteMenuItem, updateMenuItem, refreshMenuItems } = useMenuItems();
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const loadCategories = async () => {
        try {
            const data = await getMenuCategories();
            setCategories(data.map((c) => ({ id: c.id, name: c.name })));
        } catch {
            setCategories([]);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const visibleMenuItems = menuItems.filter((item) => item.available !== false);

    const searchedItems = visibleMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const normalizeCategory = (value?: string) => {
        const normalized = value?.trim();
        return normalized ? normalized : 'Uncategorized';
    };

    const categoryOptions = useMemo(() => {
        const preferredOrder = categories.map((c) => normalizeCategory(c.name));
        const itemCategories = Array.from(new Set(visibleMenuItems.map((item) => normalizeCategory(item.category))));
        const unknownCategories = itemCategories
            .filter((name) => !preferredOrder.includes(name))
            .sort((a, b) => a.localeCompare(b));
        return ['All', ...preferredOrder, ...unknownCategories];
    }, [categories, visibleMenuItems]);

    useEffect(() => {
        if (!categoryOptions.includes(selectedCategory)) {
            setSelectedCategory('All');
        }
    }, [categoryOptions, selectedCategory]);

    const filteredItems = useMemo(() => {
        if (selectedCategory === 'All') return searchedItems;
        return searchedItems.filter((item) => normalizeCategory(item.category) === selectedCategory);
    }, [searchedItems, selectedCategory]);

    const categoryCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const item of searchedItems) {
            const key = normalizeCategory(item.category);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        counts.set('All', searchedItems.length);
        return counts;
    }, [searchedItems]);

    const handleDelete = async () => {
        if (!itemToDelete || isDeleting) return;

        setIsDeleting(true);
        try {
            await deleteMenuItem(itemToDelete.id);
            toast.success(`"${itemToDelete.name}" was deleted successfully.`);
            setItemToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to delete the item. Please try again.';

            if (errorMessage.includes('existing orders') || errorMessage.includes('foreign key')) {
                toast.error(errorMessage, {
                    duration: 6000,
                });

                setTimeout(() => {
                    if (confirm(`Would you like to mark "${itemToDelete.name}" as unavailable instead?`)) {
                        updateMenuItem(itemToDelete.id, { available: false })
                            .then(() => {
                                toast.success(`"${itemToDelete.name}" has been marked as unavailable.`);
                                setItemToDelete(null);
                            })
                            .catch((updateError) => {
                                console.error('Update error:', updateError);
                                toast.error('Failed to mark item as unavailable.');
                            });
                    }
                }, 100);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddCategory = async () => {
        const name = newCategory.trim();
        if (!name) return;
        setIsAddingCategory(true);
        try {
            await createMenuCategory(name);
            toast.success(`Category "${name}" added.`);
            setNewCategory('');
            await loadCategories();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add category');
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (editingCategoryId === null) {
            toast.error('Please choose a category to edit.');
            return;
        }
        const nextName = editingCategoryName.trim();
        if (!nextName) {
            toast.error('Category name cannot be empty.');
            return;
        }
        const existingName = categories.find((c) => c.id === editingCategoryId)?.name?.trim();
        if (existingName && existingName.toLowerCase() === nextName.toLowerCase()) {
            toast.message('No changes to save.');
            setEditingCategoryId(null);
            setEditingCategoryName('');
            return;
        }
        setIsSavingCategory(true);
        try {
            await updateMenuCategory(editingCategoryId, nextName);
            // Close editor immediately once backend confirms save.
            setEditingCategoryId(null);
            setEditingCategoryName('');
            toast.success('Category updated.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update category');
            return;
        } finally {
            setIsSavingCategory(false);
        }

        // Refresh views after save; failure here should not reopen edit mode.
        try {
            await loadCategories();
            await refreshMenuItems();
        } catch {
            toast.message('Category saved. Refresh the page if list looks outdated.');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Delete this category? Existing items in this category will move to mains.')) return;
        try {
            await deleteMenuCategory(id);
            toast.success('Category deleted.');
            await loadCategories();
            await refreshMenuItems();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete category');
        }
    };
    const selectedCategoryAveragePrice = useMemo(() => {
        if (filteredItems.length === 0) return null;
        const total = filteredItems.reduce((sum, item) => sum + item.price, 0);
        return (total / filteredItems.length).toFixed(2);
    }, [filteredItems]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center font-sans text-slate-800">
                <div
                    className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#6DBE45]"
                    aria-hidden
                />
                <p className="mt-4 text-sm text-slate-500">Loading menu…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center px-4 font-sans">
                <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
                    <h2 className="font-serif text-xl font-bold text-slate-900">Couldn&apos;t load menu</h2>
                    <p className="mt-2 text-sm text-slate-600">{error}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-6 rounded-xl bg-[#6DBE45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5aa337]"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-2rem)] font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
            <div className="mx-auto max-w-7xl">
                {/* Hero — matches dashboard / landing */}
                <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                    <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
                        aria-hidden
                    />
                    <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">
                                Menu
                            </p>
                            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Menu management
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
                                Add dishes, set prices, and keep your QR menu up to date.
                            </p>
                        </div>
                        <Link
                            href="/dashboard/menu/add"
                            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#6DBE45] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,190,69,0.25)] transition-all hover:bg-[#5aa337] sm:px-6"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add item
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 sm:px-6"
                        >
                            Add Category
                        </button>
                    </div>
                </div>

                {/* Search + compact stats (one card, less vertical space) */}
                <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative min-w-0 flex-1">
                            <label htmlFor="menu-search" className="sr-only">
                                Search menu items
                            </label>
                            <input
                                id="menu-search"
                                type="search"
                                placeholder="Search items…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#6DBE45] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                                <Image src="/menu.png" alt="" width={14} height={14} className="h-3.5 w-3.5 opacity-80" />
                                <span className="font-semibold tabular-nums text-slate-900">{visibleMenuItems.length}</span>
                                <span className="text-slate-400">total</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Existing categories</h3>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {categories.length} total
                        </span>
                    </div>
                    {categories.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
                            <p className="text-sm text-slate-500">No categories yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => (
                                <div key={category.id} className="flex min-h-[64px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                                    {editingCategoryId === category.id ? (
                                        <>
                                            <input
                                                value={editingCategoryName}
                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                                className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#6DBE45] focus:ring-2 focus:ring-[#6DBE45]/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleUpdateCategory}
                                                disabled={isSavingCategory}
                                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                            >
                                                {isSavingCategory ? 'Saving...' : 'Save'}
                                            </button>
                                            <button onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="truncate text-base font-semibold text-slate-800">{category.name}</span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">Edit</button>
                                                <button onClick={() => handleDeleteCategory(category.id)} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Slim list header — replaces large “Your items” block */}
                <section aria-labelledby="menu-items-heading">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <h2 id="menu-items-heading" className="text-sm font-semibold text-slate-800">
                            Menu items
                        </h2>
                        <p className="text-xs text-slate-500">
                            {filteredItems.length === visibleMenuItems.length ? (
                                <span>
                                    <span className="tabular-nums font-medium text-slate-600">{visibleMenuItems.length}</span>
                                    {visibleMenuItems.length === 1 ? ' item' : ' items'}
                                </span>
                            ) : (
                                <>
                                    Showing{' '}
                                    <span className="font-medium text-slate-700">{filteredItems.length}</span>
                                    {' of '}
                                    <span className="font-medium text-slate-700">{visibleMenuItems.length}</span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="mb-4 sticky top-0 z-20 -mx-1 overflow-x-auto rounded-xl border border-slate-100 bg-white/95 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/75">
                        <div className="flex w-max items-center gap-2">
                            {categoryOptions.map((categoryName) => {
                                const isActive = selectedCategory === categoryName;
                                const count = categoryCounts.get(categoryName) ?? 0;
                                return (
                                    <button
                                        key={categoryName}
                                        type="button"
                                        onClick={() => setSelectedCategory(categoryName)}
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            isActive
                                                ? 'border-[#6DBE45]/40 bg-[#6DBE45]/10 text-[#3d8a2e]'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#6DBE45]/40 hover:bg-[#6DBE45]/10 hover:text-[#3d8a2e]'
                                        }`}
                                    >
                                        <span>{categoryName}</span>
                                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mb-3 flex items-center justify-end">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#6DBE45]/20 bg-[#6DBE45]/8 px-2.5 py-1.5 text-xs">
                            <span className="text-slate-500">
                                {selectedCategory === 'All' ? 'Avg (all)' : `Avg (${selectedCategory})`}
                            </span>
                            <span className="font-semibold tabular-nums text-[#6DBE45]">
                                ₹{selectedCategoryAveragePrice ?? '0.00'}
                            </span>
                        </span>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-[#6DBE45]/25 bg-[#6DBE45]/10 px-4 py-10 text-center sm:py-12">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#6DBE45]/20 bg-white shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6DBE45]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                                {visibleMenuItems.length === 0 ? 'No dishes yet' : 'No results'}
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600 sm:text-sm">
                                {visibleMenuItems.length === 0
                                    ? 'Add your first item to appear on your QR menu.'
                                    : searchQuery || selectedCategory !== 'All'
                                      ? 'Try a different search or change category filter.'
                                      : ''}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/dashboard/menu/add"
                                    className="mt-4 inline-flex items-center rounded-lg bg-[#6DBE45] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#5aa337] sm:text-sm"
                                >
                                    Add item
                                </Link>
                            )}
                            {(searchQuery || selectedCategory !== 'All') && (
                                <div className="mt-4 flex items-center justify-center gap-3">
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="text-xs font-semibold text-[#6DBE45] hover:underline"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                    {selectedCategory !== 'All' && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('All')}
                                            className="text-xs font-semibold text-[#6DBE45] hover:underline"
                                        >
                                            Show all categories
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                            {filteredItems.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    onEdit={`/dashboard/menu/${item.id}/edit`}
                                    onDelete={() => setItemToDelete(item)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <DeleteConfirmation
                isOpen={!!itemToDelete}
                onClose={() => {
                    if (!isDeleting) {
                        setItemToDelete(null);
                    }
                }}
                onConfirm={handleDelete}
                itemName={itemToDelete?.name || ''}
                isDeleting={isDeleting}
            />
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                        <h3 className="mb-3 text-lg font-semibold text-slate-900">Add category</h3>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Category name"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => { await handleAddCategory(); setIsCategoryModalOpen(false); }}
                                disabled={isAddingCategory}
                                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {isAddingCategory ? 'Adding...' : 'Add category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
