import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuItem } from '@/types/menu';
import { X, Eye } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: string;
  onDelete: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

export default function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  const [isViewing, setIsViewing] = useState(false);

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-28 w-full shrink-0 bg-slate-100 sm:h-32">
        {item.photo_url ? (
          <Image
            src={item.photo_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col p-3 sm:p-3.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-base">{item.name}</h3>
        <p className="mt-0.5 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-slate-500">{item.description}</p>
        <p className="mt-2 text-base font-bold text-[#6DBE45]">{formatPrice(item.price)}</p>
      </div>

      <div className="flex justify-end gap-1.5 border-t border-slate-100 bg-slate-50/80 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setIsViewing(true)}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-500/40 hover:text-blue-500 flex items-center gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        <Link
          href={onEdit}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#6DBE45]/40 hover:text-[#6DBE45]"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>

      {isViewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl relative flex flex-col max-h-full">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-800">Dish Details</h3>
              <button
                type="button"
                onClick={() => setIsViewing(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {item.photo_url ? (
                <div className="mb-6 flex justify-center bg-slate-50 rounded-xl overflow-hidden">
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
              ) : (
                 <div className="mb-6 flex h-48 w-full items-center justify-center rounded-xl bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                 </div>
              )}
              
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {item.category || 'uncategorized'}
                </span>
                {item.is_veg !== undefined && (
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_veg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.is_veg ? 'Veg' : 'Non-Veg'}
                  </span>
                )}
              </div>
              
              <h2 className="mb-3 text-xl font-bold text-slate-900">{item.name}</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {item.description || 'No description provided for this dish.'}
              </p>
              <p className="mt-4 text-lg font-bold text-[#6DBE45]">{formatPrice(item.price)}</p>

              {item.variants && item.variants.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="mb-2 font-bold text-slate-800 text-sm uppercase tracking-wide">Variants (Sizes)</h4>
                  <div className="flex flex-col gap-2">
                    {item.variants.map((v) => (
                      <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700 text-sm">{v.label}</span>
                        <span className="font-bold text-slate-900 text-sm">{formatPrice(Number(v.price))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.modifier_groups && item.modifier_groups.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="mb-3 font-bold text-slate-800 text-sm uppercase tracking-wide">Modifiers</h4>
                  <div className="flex flex-col gap-4">
                    {item.modifier_groups.map((group) => (
                      <div key={group.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{group.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                            {group.is_required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 font-medium">
                          Select {(group.min_selection ?? 0) > 0 ? `at least ${group.min_selection}` : 'up to'} {group.max_selection ?? 1}
                        </p>
                        {group.options && group.options.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {group.options.map((opt) => (
                              <div key={opt.id} className="flex justify-between items-center py-1.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                                <span className="text-sm font-medium text-slate-700">{opt.name}</span>
                                <span className="text-sm font-bold text-slate-600">{Number(opt.price) > 0 ? `+${formatPrice(Number(opt.price))}` : 'Free'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
