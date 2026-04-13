'use client';

import { ArrowRight, Lock } from 'lucide-react';
import { formatUsd } from './formatters';

export default function PaymentSummaryFooter({
  total,
  onCancel,
  onPay,
  payLoading = false,
  payError = ''
}) {
  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-5 sm:px-10 sm:py-6">
      <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-none flex-1 items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 sm:max-w-[min(100%,22rem)]">
          <Lock className="h-4 w-4 shrink-0 text-gray-700 sm:h-5 sm:w-5" strokeWidth={2} />
          <span className="text-xs font-medium leading-snug text-gray-700 sm:text-sm">
            Your payment is secure and encrypted
          </span>
        </div>
        <div className="flex w-full flex-col items-end gap-2 sm:w-auto sm:shrink-0">
          {payError ? (
            <p className="max-w-full text-right text-xs text-red-600">{payError}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={payLoading}
              className="rounded-lg border border-gray-900 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onPay}
              disabled={payLoading}
              className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg border-0 bg-[#0082FF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0070e0] disabled:opacity-70"
            >
              {payLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Redirecting…
                </>
              ) : (
                <>
                  Pay {formatUsd(total)}
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
