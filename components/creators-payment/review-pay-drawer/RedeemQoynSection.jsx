'use client';

import PaymentStepHeader from './PaymentStepHeader';

export default function RedeemQoynSection({
  claimDisabled = true,
  tooltipMessage = "You don't have Qoyns to claim this time"
}) {
  return (
    <section className="space-y-4">
      <PaymentStepHeader step={2} title="Redeem Qoyn" />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {claimDisabled ? (
          <div className="mb-3 rounded-lg border border-sky-200 bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-xs font-medium leading-snug text-[#007bff]">
              {tooltipMessage}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-700">Redeem Qoyns</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Tap to Redeem eligible Qoyns from your wallet
            </p>
          </div>
          <button
            type="button"
            disabled={claimDisabled}
            className="shrink-0 rounded-lg border-0 bg-[#B8DDF5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a8d4f0] disabled:cursor-not-allowed disabled:opacity-90"
          >
            Claim
          </button>
        </div>
      </div>
    </section>
  );
}
