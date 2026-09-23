'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { MenuItem } from '@/types/menu';
import ImageUpload from './ImageUpload';
import { createMenuCategory, getMenuCategories } from '@/lib/api/menuCategories';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface MenuItemFormProps {
  initialData?: MenuItem | Partial<MenuItem>;
  storageKey?: string;
  onSubmit: (data: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at'>) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#6DBE45] focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20 sm:text-base';

const DIETARY_OPTIONS = [
  { id: 'veg', label: 'Veg' },
  { id: 'non_veg', label: 'Non-Veg' },
  { id: 'egg', label: 'Egg' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'jain', label: 'Jain' },
  { id: 'gluten_free', label: 'Gluten-Free' },
];

type FormValues = {
  name: string;
  description: string;
  category: string;
  photo_url: string;
  available: boolean;
  dietary_tags: string[];
  pricingType: 'single' | 'multiple';
  price: string;
  variants: { label: string; price: string }[];
  modifier_groups: {
    name: string;
    min_selection: number;
    max_selection: number;
    is_required: boolean;
    options: { name: string; price: string }[];
  }[];
};

export default function MenuItemForm({
  initialData,
  storageKey,
  onSubmit,
  isSubmitting,
  onCancel,
}: MenuItemFormProps) {
  const [categories, setCategories] = useState<string[]>(['starters', 'mains', 'desserts', 'drinks']);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'mains',
      photo_url: initialData?.photo_url || '',
      available: initialData?.available ?? true,
      dietary_tags: initialData?.dietary_tags || (initialData?.is_veg ? ['veg'] : ['non_veg']),
      pricingType: initialData?.variants && initialData.variants.length > 0 ? 'multiple' : 'single',
      price: initialData?.price ? String(initialData.price) : '',
      variants: initialData?.variants?.map(v => ({ label: v.label, price: String(v.price) })) || [],
      modifier_groups: initialData?.modifier_groups?.map(g => ({
        name: g.name,
        min_selection: g.min_selection || 0,
        max_selection: g.max_selection || 1,
        is_required: g.is_required || false,
        options: g.options?.map(o => ({ name: o.name, price: String(o.price) })) || []
      })) || []
    }
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || 'mains',
        photo_url: initialData.photo_url || '',
        available: initialData.available ?? true,
        dietary_tags: initialData.dietary_tags || (initialData.is_veg ? ['veg'] : ['non_veg']),
        pricingType: initialData.variants && initialData.variants.length > 0 ? 'multiple' : 'single',
        price: initialData.price ? String(initialData.price) : '',
        variants: initialData.variants?.map((v: any) => ({ label: v.label, price: String(v.price) })) || [],
        modifier_groups: initialData.modifier_groups?.map((g: any) => ({
          name: g.name,
          min_selection: g.min_selection || 0,
          max_selection: g.max_selection || 1,
          is_required: g.is_required || false,
          options: g.options?.map((o: any) => ({ name: o.name, price: String(o.price) })) || []
        })) || []
      });
    }
  }, [initialData, reset]);

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: "modifier_groups"
  });

  const pricingType = watch("pricingType");
  const dietaryTags = watch("dietary_tags") || [];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getMenuCategories();
        const names = data.map((c) => c.name?.toLowerCase()).filter(Boolean);
        setCategories((prev) => Array.from(new Set([...prev, ...names])));
      } catch {
        // keep defaults
      }
    };
    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setValue('category', categories.find((c) => c.toLowerCase() === name.toLowerCase()) || name);
      setNewCategory('');
      return;
    }
    setIsAddingCategory(true);
    try {
      const normalized = name.toLowerCase();
      await createMenuCategory(normalized);
      setCategories((prev) => [...prev, normalized]);
      setValue('category', normalized);
      setNewCategory('');
    } catch {
      // ignore
    } finally {
      setIsAddingCategory(false);
    }
  };

  const toggleDietaryTag = (tagId: string) => {
    const currentTags = [...dietaryTags];
    if (currentTags.includes(tagId)) {
      setValue('dietary_tags', currentTags.filter(t => t !== tagId));
    } else {
      setValue('dietary_tags', [...currentTags, tagId]);
    }
  };

  const onSubmitForm = (data: FormValues) => {
    const payload: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at'> = {
      name: data.name,
      description: data.description,
      category: data.category,
      photo_url: data.photo_url,
      available: data.available,
      dietary_tags: data.dietary_tags,
      price: data.pricingType === 'single' ? parseFloat(data.price || '0') : 0,
      variants: data.pricingType === 'multiple' ? data.variants.map((v, i) => ({
        id: `temp-var-${i}`,
        menu_item_id: '',
        label: v.label,
        price: parseFloat(v.price || '0')
      })) : [],
      modifier_groups: data.modifier_groups.map((g, i) => ({
        id: `temp-grp-${i}`,
        menu_item_id: '',
        name: g.name,
        min_selection: g.min_selection,
        max_selection: g.max_selection,
        is_required: g.is_required,
        options: g.options.map((o, j) => ({
          id: `temp-opt-${i}-${j}`,
          modifier_group_id: '',
          name: o.name,
          price: parseFloat(o.price || '0')
        }))
      }))
    };

    onSubmit(payload);
  };

  return (
    <div className="font-sans">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        
        {/* Card 1: Core Details & Dietary Tags */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col items-center">
            <label className="mb-3 w-full text-sm font-semibold text-slate-800">Photo</label>
            <Controller
              name="photo_url"
              control={control}
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                className={inputClass}
                placeholder="e.g. Truffle Mushroom Burger"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className={inputClass}
                placeholder="Describe the dish..."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Category <span className="text-red-500">*</span>
                </label>
                <select {...register("category")} className={inputClass}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={isAddingCategory}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Available to Order
                </label>
                <div className="flex items-center mt-3">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      {...register("available")}
                      className="peer sr-only"
                    />
                    <div className="relative h-7 w-12 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-1 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-[#6DBE45] peer-checked:after:translate-x-full peer-checked:after:border-white focus:outline-none" />
                  </label>
                  <span className="ml-3 text-sm font-medium text-slate-600">Currently in stock</span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-800">
                Dietary Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((option) => {
                  const isActive = dietaryTags.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleDietaryTag(option.id)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-[#6DBE45] text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: The Pricing Engine */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Pricing Engine</h2>
          
          <div className="mb-6 flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input 
                type="radio" 
                {...register("pricingType")} 
                value="single"
                className="h-4 w-4 text-[#6DBE45] focus:ring-[#6DBE45]"
              />
              <span className="text-sm font-semibold text-slate-800">Single Price</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input 
                type="radio" 
                {...register("pricingType")} 
                value="multiple"
                className="h-4 w-4 text-[#6DBE45] focus:ring-[#6DBE45]"
              />
              <span className="text-sm font-semibold text-slate-800">Multiple Sizes (Variants)</span>
            </label>
          </div>

          {pricingType === 'single' ? (
            <div className="max-w-xs">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("price", { required: pricingType === 'single' ? "Price is required" : false })}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={inputClass}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {variantFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      {...register(`variants.${index}.label` as const, { required: true })}
                      placeholder="Size Label (e.g., Half, Full)"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-32">
                    <input
                      {...register(`variants.${index}.price` as const, { required: true })}
                      type="number"
                      placeholder="Price"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendVariant({ label: '', price: '' })}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} /> Add Size/Variant
              </button>
            </div>
          )}
        </div>

        {/* Card 3: Customizations (Modifier Groups) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Customizations</h2>
            <button
              type="button"
              onClick={() => appendGroup({ name: '', min_selection: 0, max_selection: 1, is_required: false, options: [{ name: '', price: '' }] })}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              <Plus size={16} /> Add Group
            </button>
          </div>

          <div className="space-y-6">
            {groupFields.map((group, groupIndex) => (
              <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Group Name
                    </label>
                    <input
                      {...register(`modifier_groups.${groupIndex}.name` as const, { required: true })}
                      placeholder="e.g. Spice Level, Extra Toppings"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-24">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Min
                    </label>
                    <input
                      {...register(`modifier_groups.${groupIndex}.min_selection` as const)}
                      type="number"
                      min="0"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-24">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Max
                    </label>
                    <input
                      {...register(`modifier_groups.${groupIndex}.max_selection` as const)}
                      type="number"
                      min="1"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(groupIndex)}
                    className="mt-7 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="mb-3 flex items-center">
                  <input 
                    type="checkbox"
                    {...register(`modifier_groups.${groupIndex}.is_required` as const)}
                    className="mr-2 h-4 w-4 rounded border-slate-300 text-[#6DBE45] focus:ring-[#6DBE45]"
                  />
                  <span className="text-sm font-medium text-slate-700">Required Selection</span>
                </div>

                <div className="mt-4 rounded-lg bg-white p-4 shadow-sm border border-slate-100">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">Options</h4>
                  <ModifierOptionsList control={control} register={register} groupIndex={groupIndex} />
                </div>
              </div>
            ))}
            
            {groupFields.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
                <p className="text-sm text-slate-500">No customizations added yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#6DBE45] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(109,190,69,0.25)] transition-all hover:bg-[#5aa337] disabled:opacity-50 sm:text-base"
          >
            {isSubmitting ? 'Saving…' : 'Save item'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModifierOptionsList({ control, register, groupIndex }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `modifier_groups.${groupIndex}.options`
  });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <GripVertical size={16} className="text-slate-400 cursor-move" />
          <div className="flex-1">
            <input
              {...register(`modifier_groups.${groupIndex}.options.${index}.name` as const, { required: true })}
              placeholder="Option Name"
              className={inputClass}
            />
          </div>
          <div className="w-32">
            <input
              {...register(`modifier_groups.${groupIndex}.options.${index}.price` as const)}
              type="number"
              placeholder="+ Price"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-slate-400 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ name: '', price: '' })}
        className="mt-2 text-sm font-semibold text-[#6DBE45] hover:underline"
      >
        + Add Option
      </button>
    </div>
  );
}
