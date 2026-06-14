'use client';

import React, { useMemo } from 'react';
import type { CustomerOrderStatus } from './OrderStatusTimeline';

export default function ETA({
  currentStatus,
  etaMinutes,
}: {
  currentStatus: CustomerOrderStatus;
  etaMinutes?: number | null; // This type accepts number, null, or undefined
}) {
  const derivedMinutes = useMemo(() => {
    // This check correctly handles both null and undefined values.
    if (typeof etaMinutes === 'number') return etaMinutes;
    
    // Simple fallback heuristics
    if (currentStatus === 'Pending') return 20;
    if (currentStatus === 'Confirmed') return 18;
    if (currentStatus === 'Preparing') return 10;
    if (currentStatus === 'Serve') return 2;
    return 0;
  }, [etaMinutes, currentStatus]);

  if (currentStatus === 'Complete' || currentStatus === 'Cancelled') {
    return (
      <p className="text-lg font-semibold text-gray-500">
        N/A
      </p>
    );
  }

  return (
    <p className="text-lg font-semibold text-gray-900">
      ~ {derivedMinutes} min
    </p>
  );
}