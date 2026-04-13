'use client';

import { X } from 'lucide-react';

export default function PaymentSummaryHeader({ onClose }) {
  return (
    <div className="shrink-0 border-b border-gray-200 px-6 pb-5 pt-7 sm:px-10 sm:pb-6 sm:pt-8">
      <div className="flex w-full items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
            Payment Summary
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 sm:text-[15px]">
            Review transactions and select payment method
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-[#007bff] transition hover:bg-blue-50"
          aria-label="Close"
        >
          <X className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
