'use client';

import { useEffect, useState } from 'react';
import PaymentSummaryHeader from './PaymentSummaryHeader';
import TransactionDetailsSection from './TransactionDetailsSection';
import RedeemQoynSection from './RedeemQoynSection';
import PaymentBreakdownSection from './PaymentBreakdownSection';
import PaymentSummaryFooter from './PaymentSummaryFooter';
import { computePaymentTotals } from './formatters';

/**
 * Left-side payment summary drawer (Review & Pay from Owed).
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {Array<object>} assignments — gig assignment rows from API
 * @param {(payload: { assignments: object[], totals: object }) => void | Promise<void>} [onPay]
 */
export default function PaymentSummaryDrawer({
  open,
  onClose,
  assignments = [],
  onPay
}) {
  const totals = computePaymentTotals(assignments);
  const lineTotal = totals.gigSum + totals.successSum;
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setPayError('');
      setPayLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handlePay = async () => {
    if (!onPay) return;
    setPayError('');
    setPayLoading(true);
    try {
      await onPay({ assignments, totals });
    } catch (e) {
      setPayError(e?.message || 'Payment could not start. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="absolute left-0 top-0 flex h-full w-full min-w-0 max-w-4xl flex-col bg-white shadow-2xl rounded-r-2xl sm:rounded-r-3xl"
        onClick={(e) => e.stopPropagation()}
        aria-label="Payment summary"
      >
        <PaymentSummaryHeader onClose={onClose} />

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 sm:px-10 sm:py-7">
          <div className="w-full space-y-9 pb-2">
            <TransactionDetailsSection
              assignments={assignments}
              gigSum={totals.gigSum}
              successSum={totals.successSum}
              lineTotal={lineTotal}
            />

            <div className="border-t border-gray-200" />

            <RedeemQoynSection claimDisabled />

            <div className="border-t border-gray-200" />

            <PaymentBreakdownSection
              transactionCount={totals.transactionCount}
              subtotal={totals.subtotal}
              platformFee={totals.platformFee}
              vat={totals.vat}
              total={totals.total}
            />
          </div>
        </div>

        <PaymentSummaryFooter
          total={totals.total}
          onCancel={onClose}
          onPay={handlePay}
          payLoading={payLoading}
          payError={payError}
        />
      </aside>
    </div>
  );
}
