import Image from 'next/image';
import Link from 'next/link';
import { MenuItem } from '@/types/menu';

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
  return (
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
  );
}
