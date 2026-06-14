'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export type CustomerOrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Serve' | 'Complete' | 'Cancelled';

const STEPS: { key: CustomerOrderStatus; label: string }[] = [
  { key: 'Pending',   label: 'Payment confirmation' },
  { key: 'Confirmed', label: 'Order received' },
  { key: 'Preparing', label: 'Being cooked' },
  { key: 'Serve',     label: 'Ready to serve' },
  // { key: 'Complete',  label: 'Completed' },
];

function indexOfStatus(s: CustomerOrderStatus) {
  const i = STEPS.findIndex((x) => x.key === s);
  return i < 0 ? 0 : i;
}

export default function OrderStatusTimeline({ currentStatus }: { currentStatus: CustomerOrderStatus }) {
  const currentIdx = indexOfStatus(currentStatus);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <ol className="relative border-s-2 border-gray-200 ps-6">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx && currentStatus !== 'Cancelled';
          const active = idx === currentIdx;

          return (
            <li key={step.key} className="mb-8 ms-6">
              <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                {done ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
              </span>
              <h3 className={`font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`}>{step.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{step.key}</p>
            </li>
          );
        })}
        {currentStatus === 'Cancelled' && (
          <li className="mb-2 ms-6">
            <span className="absolute -start-3 h-6 w-6 rounded-full bg-white" />
            <h3 className="font-semibold text-red-600">Order Cancelled</h3>
            <p className="mt-1 text-sm text-gray-500">Please contact staff if this seems incorrect.</p>
          </li>
        )}
      </ol>
    </div>
  );
}
