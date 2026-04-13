'use client';

import PaymentStepHeader from './PaymentStepHeader';
import { formatUsd } from './formatters';

export default function PaymentBreakdownSection({
  transactionCount,
  subtotal,
  platformFee,
  vat,
  total
}) {
  return (
    <section className="space-y-4">
      <PaymentStepHeader step={3} title="Payment Breakdown" />

      <div className="rounded-xl border border-[#7EB8E8] bg-[#E8F4FC] px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="space-y-3.5 text-sm sm:text-[15px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-900">
              Subtotal ({transactionCount} transaction{transactionCount === 1 ? '' : 's'})
            </span>
            <span className="font-bold text-gray-900">{formatUsd(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-900">Platform Fee 15%</span>
            <span className="font-bold text-[#007bff]">{formatUsd(platformFee)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-900">VAT</span>
            <span className="font-bold text-orange-500">{formatUsd(vat)}</span>
          </div>
        </div>
        <div className="my-5 border-t border-gray-300/60" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-[#007bff]">{formatUsd(total)}</span>
        </div>
      </div>
    </section>
  );
}
