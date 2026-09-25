'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MenuItem, MenuItemVariant, ModifierGroup, SelectedModifier } from '@/types/menu';

interface ModifierSelectionSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    variantId?: string,
    variantLabel?: string,
    variantPrice?: number,
    selectedModifiers?: SelectedModifier[],
    unitPrice?: number
  ) => void;
}

export default function ModifierSelectionSheet({
  item,
  isOpen,
  onClose,
  onAddToCart
}: ModifierSelectionSheetProps) {
  // State for selected variant
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
  
  // State for selected modifiers: Record<GroupId, SelectedModifier[]>
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, SelectedModifier[]>>({});

  // Reset state when item changes or sheet opens
  useEffect(() => {
    if (isOpen && item) {
      if (item.variants && item.variants.length > 0) {
        setSelectedVariant(item.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setSelectedModifiers({});
    }
  }, [isOpen, item]);

  // Calculate live price
  const livePrice = useMemo(() => {
    if (!item) return 0;
    
    let total = selectedVariant ? Number(selectedVariant.price) : Number(item.price);
    
    Object.values(selectedModifiers).forEach(groupMods => {
      groupMods.forEach(mod => {
        total += Number(mod.price);
      });
    });
    
    return total;
  }, [item, selectedVariant, selectedModifiers]);

  // Validation
  const isValid = useMemo(() => {
    if (!item || !item.modifier_groups) return true;
    
    for (const group of item.modifier_groups) {
      if (group.min_selection && group.min_selection > 0) {
        const groupSelections = selectedModifiers[group.id] || [];
        if (groupSelections.length < group.min_selection) {
          return false;
        }
      }
    }
    return true;
  }, [item, selectedModifiers]);

  const handleModifierChange = (group: ModifierGroup, option: any, checked: boolean) => {
    setSelectedModifiers(prev => {
      const currentSelections = prev[group.id] || [];
      const newSelections = { ...prev };
      
      if (group.max_selection === 1) {
        // Radio behavior
        newSelections[group.id] = checked ? [{ id: option.id, name: option.name, price: Number(option.price) }] : [];
      } else {
        // Checkbox behavior
        if (checked) {
          if (!group.max_selection || currentSelections.length < group.max_selection) {
            newSelections[group.id] = [...currentSelections, { id: option.id, name: option.name, price: Number(option.price) }];
          }
        } else {
          newSelections[group.id] = currentSelections.filter(m => m.id !== option.id);
        }
      }
      return newSelections;
    });
  };

  const handleAddToCart = () => {
    if (!item || !isValid) return;

    // Flatten modifiers
    const allModifiers: SelectedModifier[] = Object.values(selectedModifiers).flat();

    onAddToCart(
      item,
      selectedVariant?.id,
      selectedVariant?.label,
      selectedVariant ? Number(selectedVariant.price) : undefined,
      allModifiers,
      livePrice
    );
    
    onClose();
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[51] flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-5 pb-4">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-8">
              
              {/* Variants Section */}
              {item.variants && item.variants.length > 0 && (
                <section>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Choose Size</h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Required</span>
                  </div>
                  <div className="space-y-3">
                    {item.variants.map(variant => (
                      <div
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex min-h-[56px] cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors ${
                          selectedVariant?.id === variant.id
                            ? 'border-[#6DBE45] bg-[#6DBE45]/5'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            selectedVariant?.id === variant.id
                              ? 'border-[#6DBE45] bg-[#6DBE45]'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {selectedVariant?.id === variant.id && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-800">{variant.label}</span>
                        </div>
                        <span className="font-semibold text-slate-900">₹{variant.price}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Modifier Groups Section */}
              {item.modifier_groups?.map(group => {
                const groupSelections = selectedModifiers[group.id] || [];
                const isMaxReached = group.max_selection && group.max_selection > 1 && groupSelections.length >= group.max_selection;
                const isRequired = group.min_selection && group.min_selection > 0;

                return (
                  <section key={group.id}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <h3 className="text-lg font-bold text-slate-900">{group.name}</h3>
                      {isRequired ? (
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Required</span>
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Optional</span>
                      )}
                    </div>
                    {group.max_selection && group.max_selection > 1 && (
                      <p className="mb-3 text-xs text-slate-500">Choose up to {group.max_selection}</p>
                    )}
                    
                    <div className="mt-3 space-y-3">
                      {group.options?.map(option => {
                        const isSelected = groupSelections.some(m => m.id === option.id);
                        const isDisabled = !isSelected && isMaxReached && group.max_selection !== 1;

                        return (
                          <div
                            key={option.id}
                            onClick={() => {
                              if (!isDisabled) {
                                handleModifierChange(group, option, !isSelected);
                              }
                            }}
                            className={`flex min-h-[56px] cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors ${
                              isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''
                            } ${
                              isSelected
                                ? 'border-[#6DBE45] bg-[#6DBE45]/5'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Custom Checkbox/Radio styling */}
                              <div className={`flex h-5 w-5 items-center justify-center border-2 ${
                                group.max_selection === 1 ? 'rounded-full' : 'rounded-md'
                              } ${
                                isSelected
                                  ? 'border-[#6DBE45] bg-[#6DBE45]'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && (
                                  group.max_selection === 1 ? (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  ) : (
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )
                                )}
                              </div>
                              <span className="font-semibold text-slate-800">{option.name}</span>
                            </div>
                            {Number(option.price) > 0 && (
                              <span className="font-semibold text-slate-600">+₹{option.price}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

            </div>

            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:pb-4">
              <button
                onClick={handleAddToCart}
                disabled={!isValid}
                className={`flex w-full items-center justify-center rounded-2xl py-4 text-base font-bold text-white transition-all ${
                  isValid 
                    ? 'bg-[#6DBE45] shadow-[0_8px_20px_rgba(109,190,69,0.25)] hover:bg-[#5aa337]' 
                    : 'bg-slate-300 opacity-80 cursor-not-allowed'
                }`}
              >
                {isValid ? `Add Item • ₹${livePrice}` : 'Select Required Options'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
