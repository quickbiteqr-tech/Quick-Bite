'use client';

import { useEffect, useState } from 'react';

type Props = {
  logoUrl?: string | null;
  restaurantName?: string | null;
  /** Tailwind classes for the outer circle (size, colors, typography for the initial). */
  className?: string;
};

const defaultClassName =
  'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#b11c1c] text-lg font-bold text-white';

/**
 * Shows restaurant logo when URL is set and loads; otherwise first letter of the name (or "R").
 */
export default function RestaurantLogoCircle({
  logoUrl,
  restaurantName,
  className = defaultClassName,
}: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const trimmed = logoUrl?.trim() ?? '';
  const canTryImage = trimmed.length > 0 && !loadFailed;

  useEffect(() => {
    setLoadFailed(false);
  }, [trimmed]);

  const initial = restaurantName?.trim().charAt(0)?.toUpperCase() || 'R';

  return (
    <div className={className}>
      {canTryImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
