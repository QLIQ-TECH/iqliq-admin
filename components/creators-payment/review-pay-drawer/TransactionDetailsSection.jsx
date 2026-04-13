'use client';

import Image from 'next/image';
import { DollarSign, TrendingUp } from 'lucide-react';
import PaymentStepHeader from './PaymentStepHeader';
import { formatUsd } from './formatters';

function avatarInitial(name) {
  const s = String(name || '?').trim();
  return s ? s.charAt(0).toUpperCase() : '?';
}

export default function TransactionDetailsSection({ assignments, gigSum, successSum, lineTotal }) {
  const list = Array.isArray(assignments) ? assignments : [];
  const first = list[0];
  const inf = first?.influencerId;
  const multi = list.length > 1;
  const name = multi
    ? `${list.length} payees`
    : inf?.name?.trim() ||
      inf?.email?.split('@')[0] ||
      'Unknown';
  const pic = multi ? null : inf?.profilePicture;
  const typeLabel = multi
    ? 'Multiple gigs'
    : first?.gigId?.typeOfGig || 'Gig';
  const unknown = !multi && !inf;

  return (
    <section className="space-y-4">
      <PaymentStepHeader step={1} title="Transaction Details" />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {pic && !unknown ? (
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200">
                <Image
                  src={pic}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover"
                  unoptimized
                />
              </span>
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-lg font-bold text-white shadow-inner">
                {multi ? String(list.length) : unknown ? '?' : avatarInitial(name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900">{name}</span>
                <span className="inline-flex max-w-full rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-100">
                  {typeLabel}
                </span>
              </div>
              {multi ? (
                <p className="mt-1 text-xs text-gray-500">
                  Combined gig and bonus amounts below
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500 sm:text-sm">Total</p>
            <p className="text-2xl font-bold text-emerald-600 sm:text-[1.65rem]">
              {formatUsd(lineTotal)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-100/90 px-4 py-4 ring-1 ring-slate-200/80">
            <div className="flex items-center gap-2 text-[#007bff]">
              <DollarSign className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-gray-600">Gig Amount</span>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">{formatUsd(gigSum)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-gray-600">Success Bonus</span>
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-600">{formatUsd(successSum)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
