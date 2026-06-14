'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/types/menu';
import ImageUpload from './ImageUpload';
import { createMenuCategory, getMenuCategories } from '@/lib/api/menuCategories';

interface MenuItemFormProps {
  initialData?: MenuItem;
  onSubmit: (data: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at'>) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#6DBE45] focus:outline-none focus:ring-2 focus:ring-[#6DBE45]/20 sm:text-base';

export default function MenuItemForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'mains',
    is_veg: true,
    photo_url: '',
    available: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [categories, setCategories] = useState<string[]>(['starters', 'mains', 'desserts', 'drinks']);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getMenuCategories();
        const names = data.map((c) => c.name?.toLowerCase()).filter(Boolean);
        setCategories((prev) => Array.from(new Set([...prev, ...names])));
      } catch {
        // keep defaults when category table not yet available
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        price: String(initialData.price),
        category: initialData.category || 'mains',
        is_veg: initialData.is_veg ?? true,
        photo_url: initialData.photo_url || '',
        available: initialData.available ?? true,
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (!formData.price) newErrors.price = 'Price is required.';
    if (!formData.category.trim()) newErrors.category = 'Category is required.';
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      newErrors.price = 'Please enter a valid, positive price.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === 'price') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const decimalCount = (numericValue.match(/\./g) || []).length;
      const sanitizedValue =
        decimalCount > 1 ? numericValue.substring(0, numericValue.lastIndexOf('.')) : numericValue;
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        category: formData.category,
        price: parseFloat(formData.price),
      });
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setFormData((prev) => ({ ...prev, category: categories.find((c) => c.toLowerCase() === name.toLowerCase()) || name }));
      setNewCategory('');
      return;
    }
    setIsAddingCategory(true);
    try {
      const normalized = name.toLowerCase();
      await createMenuCategory(normalized);
      setCategories((prev) => [...prev, normalized]);
      setFormData((prev) => ({ ...prev, category: normalized }));
      setNewCategory('');
    } catch {
      setErrors((prev) => ({ ...prev, category: 'Could not create category. Ensure DB has menu_categories table.' }));
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-8">
        <div className="flex flex-col items-center">
          <label className="mb-3 w-full text-sm font-semibold text-slate-800 sm:text-base">Photo</label>
          <ImageUpload
            value={formData.photo_url}
            onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url || '' }))}
          />
        </div>

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={inputClass}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={inputClass}
              placeholder="0.00"
              inputMode="decimal"
            />
            {errors.price && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.price}</p>}
          </div>
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.category}</p>}
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
                {isAddingCategory ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="is_veg" className="mb-2 block text-sm font-semibold text-slate-800 sm:text-base">
              Food Type <span className="text-red-500">*</span>
            </label>
            <select
              id="is_veg"
              name="is_veg"
              value={formData.is_veg ? 'veg' : 'non-veg'}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_veg: e.target.value === 'veg' }))}
              className={inputClass}
            >
              <option value="veg">Veg</option>
              <option value="non-veg">Non Veg</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <label htmlFor="available" className="text-sm font-semibold text-slate-800 sm:text-base">
            Available to order
          </label>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              id="available"
              name="available"
              checked={formData.available}
              onChange={handleChange}
              className="peer sr-only"
            />
            <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-[#6DBE45] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6DBE45]/30 peer-focus:ring-offset-2" />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
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
