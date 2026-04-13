'use client';

import Image from 'next/image';
import {
  PAYMENT_HEADER_BLUE,
  avatarClassForName,
  formatCurrency,
  formatUsDate,
  getDisplayStatus
} from './creatorsPaymentTableUtils';

const HEADER_BLUE = PAYMENT_HEADER_BLUE;

function statusPillClasses(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'pending') {
    return 'bg-[#FFFBEB] text-[#92400E] border border-amber-100/80';
  }
  if (
    s === 'approved' ||
    s === 'completed' ||
    s === 'paid' ||
    s === 'accepted' ||
    s === 'active'
  ) {
    return 'bg-emerald-50 text-emerald-800 border border-emerald-100';
  }
  if (s === 'rejected') {
    return 'bg-red-50 text-red-800 border border-red-100';
  }
  return 'bg-gray-100 text-gray-800 border border-gray-200';
}

export default function CreatorPaymentsTable({
  rows,
  loading,
  emptyMessage = 'No payment records found.',
  loadingMessage = 'Loading payments...'
}) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ backgroundColor: HEADER_BLUE }}>
              <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Account
              </th>
              <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Date
              </th>
              <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Collaboration content
              </th>
              <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white text-right">
                Task amount
              </th>
              <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white text-right">
                Success amount
              </th>
              <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-500">
                  {loadingMessage}
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => {
                const inf = row?.influencerId;
                const name = inf?.name?.trim() || inf?.email || '';
                const pic = inf?.profilePicture;
                const unknown = !inf;
                const displayName = unknown ? 'Unknown' : name || 'Unknown';
                const initial = unknown
                  ? '?'
                  : (displayName.charAt(0) || '?').toUpperCase();
                const status = getDisplayStatus(row);

                return (
                  <tr
                    key={row._id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        {pic && !unknown ? (
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200">
                            <Image
                              src={pic}
                              alt=""
                              width={36}
                              height={36}
                              className="h-9 w-9 object-cover"
                              unoptimized
                            />
                          </span>
                        ) : (
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                              unknown ? 'bg-gray-400' : avatarClassForName(displayName)
                            }`}
                          >
                            {unknown ? '?' : initial}
                          </span>
                        )}
                        <span className="font-semibold text-gray-900 truncate text-sm">
                          {displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-gray-500 whitespace-nowrap">
                      {formatUsDate(row?.createdAt)}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-gray-900">
                      {row?.gigId?.title ?? '—'}
                    </td>
                    <td className="px-4 py-4 align-middle text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(row?.gigId?.gigcompletionAmount)}
                    </td>
                    <td className="px-4 py-4 align-middle text-right text-sm font-semibold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(row?.gigId?.gigSuccessAmount)}
                    </td>
                    <td className="px-4 py-4 align-middle text-right">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${statusPillClasses(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
