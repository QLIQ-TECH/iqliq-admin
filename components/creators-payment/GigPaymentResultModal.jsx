'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

export default function GigPaymentResultModal({ open, variant, onClose }) {
  if (!open) return null;

  const success = variant === 'success';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="gig-pay-modal-title"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center">
          {success ? (
            <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.75} />
          ) : (
            <XCircle className="h-14 w-14 text-amber-500" strokeWidth={1.75} />
          )}
          <h2
            id="gig-pay-modal-title"
            className="mt-4 text-xl font-bold text-gray-900"
          >
            {success ? 'Payment successful' : 'Payment cancelled'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {success
              ? 'Your creator payment was processed. The owed list will refresh shortly.'
              : 'You left Stripe checkout without completing payment. You can try again anytime.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-[#0082FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0070e0]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
