'use client';

import React from 'react';
import type { CustomerOrderStatus } from './OrderStatusTimeline';

export default function StatusBadge({ status }: { status: CustomerOrderStatus }) {
  const color =
    status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
    status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
    status === 'Preparing' ? 'bg-orange-100 text-orange-800' :
    status === 'Serve' ? 'bg-green-100 text-green-800' :
    status === 'Complete' ? 'bg-emerald-100 text-emerald-800' :
    'bg-red-100 text-red-700';

  return (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${color}`}>
      {status}
    </span>
  );
}
