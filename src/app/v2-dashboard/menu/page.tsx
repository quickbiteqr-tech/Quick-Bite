"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useMenuItems } from '@/lib/hooks/useMenuItems';
import { MenuItem } from '@/types/menu';
import { toast } from 'sonner';
import { Loader2, Plus, Search, X, Image as ImageIcon, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MenuItemForm from '@/components/menu/MenuItemForm';
import GlobalTemplateBrowser from '@/components/menu/GlobalTemplateBrowser';
import { getMyRestaurant } from '@/lib/api/restaurants';
import { createMenuCategory } from '@/lib/api/menuCategories';

// --- Menu Item Catalog Card ---
const V2MenuItemCard = ({ item, onEdit, onToggle }: { item: MenuItem, onEdit: () => void, onToggle: () => Promise<void> }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isAvailable, setIsAvailable] = useState(item.available !== false);

  const handleToggle = async () => {
    setIsToggling(true);
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await onToggle();
      toast.success(next ? `${item.name} is now Live` : `${item.name} marked Out of Stock`);
    } catch {
      setIsAvailable(!next);
      toast.error('Failed to update stock status');
    } finally {
      setIsToggling(false);
    }
  };

  const isVeg = item.is_veg ?? item.dietary_tags?.includes('veg');
  const hasVariants = item.variants && item.variants.length > 0;
  
  let displayPrice = `₹${item.price}`;
  if (hasVariants) {
    const lowestPrice = Math.min(...item.variants!.map(v => v.price));
    displayPrice = `From ₹${lowestPrice} • ${item.variants!.length} Variants`;
  }

  return (
    <div className={`group relative bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md border border-slate-200/60 hover:border-[#6DBE45]/30 transition-all cursor-pointer ${!isAvailable ? 'opacity-60 grayscale hover:opacity-80' : ''}`}>
       
       <div onClick={onEdit}>
         {/* Hero Image (16:9 Aspect Ratio) */}
         <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
            {item.photo_url ? (
               <img src={item.photo_url} alt={item.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
            ) : (
               <div className="flex items-center justify-center w-full h-full text-slate-300 bg-slate-50">
                  <ImageIcon size={32} />
               </div>
            )}
         </div>
         
         <div className="p-4 md:p-5">
           <div className="flex gap-2 items-center mb-1">
              <div className={`w-3.5 h-3.5 border flex shrink-0 items-center justify-center rounded-[2px] ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
              </div>
              <h3 className="font-bold text-slate-800 line-clamp-1">{item.name}</h3>
           </div>
           <p className="text-xs font-semibold text-slate-400 line-clamp-1 mb-2.5">
             {item.description || 'No description provided.'}
           </p>
           <p className="text-[#6DBE45] font-black text-sm">{displayPrice}</p>
         </div>
       </div>

       {/* Stock Toggle */}
       <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={handleToggle}
            disabled={isToggling}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out shadow-inner ${isAvailable ? 'bg-[#6DBE45]' : 'bg-slate-300/80 backdrop-blur-md'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`}>
               {!isAvailable && <div className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
          </button>
       </div>
    </div>
  )
}

// --- Main Operational Menu Page ---
export default function MenuManagementPage() {
  const { menuItems, loading, error, updateMenuItem, addMenuItem } = useMenuItems();
  const [search, setSearch] = useState('');
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Template Browser State
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [templateData, setTemplateData] = useState<Partial<any>>();

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    getMyRestaurant().then(res => {
      if (res) setRestaurantId(res.id);
    });
  }, []);

  const openAddSheet = () => {
    setEditingItem(null);
    setTemplateData(undefined);
    setIsSheetOpen(true);
  };

  const openEditSheet = (item: MenuItem) => {
    setEditingItem(item);
    setTemplateData(undefined);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      setEditingItem(null);
      setTemplateData(undefined);
    }, 300); // Wait for animation
  };

  const handleTemplateSelect = (item: any) => {
    setTemplateData({
      name: item.name,
      description: item.description || '',
      price: item.price || 0,
      category: item.category || 'mains',
      photo_url: item.image_url || '',
    });
    setShowTemplateBrowser(false);
  };

  const handleSubmit = async (data: any) => {
    if (!restaurantId) return toast.error('Restaurant ID not found.');
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        toast.success('Item updated successfully!');
      } else {
        await addMenuItem({
           ...data,
           category: data.category || 'mains',
           available: data.available ?? true,
        }, restaurantId);
        toast.success('Item created successfully!');
      }
      closeSheet();
    } catch (err) {
      toast.error('Failed to save item');
    } finally {
      setIsSubmitting(false);
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
      setIsCategoryModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Grouping items dynamically
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    const filtered = menuItems.filter(item => 
       item.name.toLowerCase().includes(search.toLowerCase()) || 
       item.description?.toLowerCase().includes(search.toLowerCase())
    );

    filtered.forEach(item => {
      const cat = item.category?.trim() || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems, search]);

  const categories = useMemo(() => Object.keys(groupedItems).sort(), [groupedItems]);

  if (loading) {
    return (
       <div className="w-full h-[80vh] flex flex-col items-center justify-center font-sans">
          <Loader2 className="w-12 h-12 animate-spin text-[#6DBE45] mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Loading Menu...</p>
       </div>
    );
  }

  if (error) {
    return (
       <div className="w-full h-[80vh] flex items-center justify-center">
          <p className="text-rose-500 font-bold">{error}</p>
       </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans flex flex-col pb-24 lg:pb-10 relative">
       
       {/* ATC Header */}
       <div className="mb-6 lg:mb-8 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
               Live Menu Management
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
               Instantly 86 items or edit your catalog.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-sm focus:outline-none focus:border-[#6DBE45] focus:ring-1 focus:ring-[#6DBE45] transition-all shadow-sm"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={() => setIsCategoryModalOpen(true)}
                 className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-[#6DBE45] hover:text-[#6DBE45] transition-colors text-sm whitespace-nowrap"
               >
                 Add Category
               </button>
               <button 
                 onClick={openAddSheet}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 text-sm whitespace-nowrap"
               >
                 <Plus className="w-4 h-4" /> Add Item
               </button>
            </div>
          </div>
       </div>

       {/* Two Column Layout */}
       <div className="flex flex-col lg:flex-row gap-8 items-start px-4 md:px-6 lg:px-8">
          
          {/* Desktop Left Sidebar - Sticky */}
          <div className="hidden lg:flex flex-col w-64 xl:w-72 sticky top-6 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 max-h-[85vh] overflow-y-auto shrink-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Jump to Category</h2>
            <div className="flex flex-col gap-1.5 custom-scrollbar">
              {categories.map(cat => (
                <a 
                  key={cat} 
                  href={`#cat-${cat}`} 
                  className="text-sm font-bold text-slate-600 hover:text-[#6DBE45] hover:bg-[#6DBE45]/10 px-4 py-3 rounded-xl transition-all active:scale-95"
                >
                  {cat}
                  <span className="float-right bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                     {groupedItems[cat].length}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Nav - Sticky Top */}
          <div className="lg:hidden sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 py-3 flex overflow-x-auto gap-2 custom-scrollbar shadow-sm">
              {categories.map(cat => (
                <a 
                  key={cat} 
                  href={`#cat-${cat}`} 
                  className="whitespace-nowrap text-xs font-black uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:border-[#6DBE45] hover:text-[#6DBE45] px-4 py-2.5 rounded-full transition-colors shrink-0 shadow-sm"
                >
                  {cat}
                </a>
              ))}
          </div>

          {/* Right Content Area */}
          <div className="w-full flex-1 flex flex-col gap-12 pt-6 lg:pt-0">
            {categories.map(cat => (
              <div key={cat} id={`cat-${cat}`} className="scroll-mt-24 lg:scroll-mt-10">
                <div className="flex justify-between items-end mb-6 border-b border-slate-200/60 pb-3">
                   <h3 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{cat}</h3>
                   <span className="bg-slate-200/50 text-slate-500 font-bold px-3 py-1 rounded-full text-xs">
                      {groupedItems[cat].length} Items
                   </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
                  {groupedItems[cat].map(item => (
                    <V2MenuItemCard 
                      key={item.id} 
                      item={item} 
                      onEdit={() => openEditSheet(item)}
                      onToggle={() => updateMenuItem(item.id, { available: !item.available })} 
                    />
                  ))}
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="w-full h-40 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-200 border-dashed">
                 <p className="text-slate-500 font-bold text-sm">No items found.</p>
                 <button onClick={openAddSheet} className="mt-4 text-[#6DBE45] font-bold text-sm hover:underline">
                    Add your first item
                 </button>
              </div>
            )}
          </div>
       </div>

       {/* Slide-Over Sheet */}
       <AnimatePresence>
         {isSheetOpen && (
           <>
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={closeSheet}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
             />

             {/* Sheet Container */}
             <motion.div
               initial={{ y: '100%', x: 0 }} 
               animate={{ y: 0, x: 0 }}
               exit={{ y: '100%', x: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-x-0 bottom-0 lg:top-0 lg:bottom-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[600px] bg-slate-50 z-[101] rounded-t-[2rem] lg:rounded-t-none lg:rounded-l-[2rem] shadow-2xl flex flex-col h-[90vh] lg:h-screen overflow-hidden"
             >
                <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-start shadow-sm z-10 shrink-0">
                   <div>
                     <h2 className="text-xl font-black text-slate-800">
                       {editingItem ? 'Edit Dish' : 'Add New Dish'}
                     </h2>
                     {!editingItem && (
                       <button
                         type="button"
                         onClick={() => setShowTemplateBrowser(true)}
                         className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#6DBE45] hover:text-white transition-colors"
                       >
                         <BookOpen size={14} /> Browse Templates
                       </button>
                     )}
                   </div>
                   <button 
                     onClick={closeSheet} 
                     className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
                
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar pb-32">
                   <MenuItemForm 
                      initialData={editingItem || templateData || undefined}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                      onCancel={closeSheet}
                   />
                </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>

       {/* Add Category Modal */}
       {isCategoryModalOpen && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
               <h3 className="mb-4 text-xl font-black text-slate-900 tracking-tight">Add Category</h3>
               <input
                   type="text"
                   value={newCategory}
                   onChange={(e) => setNewCategory(e.target.value)}
                   placeholder="e.g. Starters, Beverages"
                   className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6DBE45] focus:bg-white transition-colors"
                   onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                   autoFocus
               />
               <div className="mt-6 flex justify-end gap-3">
                   <button
                       type="button"
                       onClick={() => setIsCategoryModalOpen(false)}
                       className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                   >
                       Cancel
                   </button>
                   <button
                       type="button"
                       onClick={handleAddCategory}
                       disabled={isAddingCategory}
                       className="rounded-xl bg-[#6DBE45] px-5 py-2.5 text-sm font-black text-white hover:bg-[#5aa337] transition-colors disabled:opacity-50"
                   >
                       {isAddingCategory ? 'Adding...' : 'Add Category'}
                   </button>
               </div>
            </div>
         </div>
       )}

       {/* Template Browser */}
       {showTemplateBrowser && (
         <div className="fixed inset-0 z-[200]">
           <GlobalTemplateBrowser
             onSelect={handleTemplateSelect}
             onClose={() => setShowTemplateBrowser(false)}
           />
         </div>
       )}
    </div>
  );
}
