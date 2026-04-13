'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import {
  OWED_HEADER_BLUE,
  collaborationContent,
  formatCurrency,
  formatUsDate,
  getDisplayStatus
} from './creatorsPaymentTableUtils';

function statusPillClasses(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'accepted') {
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200/80';
  }
  if (s === 'pending') {
    return 'bg-[#FFFBEB] text-[#92400E] border border-amber-100/80';
  }
  if (s === 'approved' || s === 'completed' || s === 'paid') {
    return 'bg-emerald-50 text-emerald-800 border border-emerald-100';
  }
  if (s === 'rejected') {
    return 'bg-red-50 text-red-800 border border-red-100';
  }
  return 'bg-gray-100 text-gray-800 border border-gray-200';
}

function rowId(row) {
  const id = row?._id;
  if (id == null) return '';
  return typeof id === 'object' && id !== null && '$oid' in id
    ? String(id.$oid)
    : String(id);
}

export default function CreatorOwedTable({
  rows,
  loading,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onReviewAndPay,
  reviewPayDisabled
}) {
  const ids = useMemo(() => rows.map((r) => rowId(r)).filter(Boolean), [rows]);
  const allSelected =
    ids.length > 0 && ids.every((id) => selectedIds.has(id));
  const someSelected = ids.some((id) => selectedIds.has(id));

  const selectAllRef = useRef(null);
  useEffect(() => {
    const el = selectAllRef.current;
    if (el) {
      el.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const handleReviewPayClick = () => {
    if (reviewPayDisabled) return;
    onReviewAndPay?.();
  };

  const buttonDisabled = reviewPayDisabled;

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar — own border + radius */}
      <div className="rounded-xl border border-[#B8D4E8] bg-[#0082FF]/20 px-4 py-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#0082FF]">
            Select payee to review and pay.
          </p>
          <button
            type="button"
            onClick={handleReviewPayClick}
            disabled={buttonDisabled}
            className={`shrink-0 rounded-lg px-5 py-2 text-sm font-semibold shadow-sm transition border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0082FF] focus-visible:ring-offset-2 ${
              reviewPayDisabled
                ? 'bg-[#5DADE2] text-white opacity-50 cursor-not-allowed'
                : 'bg-[#0082FF] text-white hover:brightness-95'
            }`}
          >
            Review &amp; Pay
          </button>
        </div>
      </div>

      {/* Table — separate border + radius */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr
              className="rounded-t-none"
              style={{ backgroundColor: OWED_HEADER_BLUE }}
            >
              <th className="w-12 px-3 py-3.5 align-middle first:rounded-tl-none">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected && ids.length > 0}
                  onChange={onToggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-white/40 bg-white/90 text-[#007bff] focus:ring-2 focus:ring-white/80"
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Account
              </th>
              <th className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Date
              </th>
              <th className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Collaboration content
              </th>
              <th className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white text-right">
                Task amount
              </th>
              <th className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white text-right">
                Success amount
              </th>
              <th className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white text-right last:rounded-tr-none">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-500">
                  No owed records found.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row, rowIndex) => {
                const id = rowId(row);
                const inf = row?.influencerId;
                const name = inf?.name?.trim() || inf?.email || '';
                const pic = inf?.profilePicture;
                const unknown = !inf;
                const displayName = unknown ? 'Unknown' : name || 'Unknown';
                const initial = unknown
                  ? '?'
                  : (displayName.charAt(0) || '?').toUpperCase();
                const status = getDisplayStatus(row);
                const checked = id ? selectedIds.has(id) : false;

                return (
                  <tr
                    key={id || `owed-row-${rowIndex}`}
                    className="border-b border-[#eeeeee] last:border-b-0 hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-3 py-4 align-middle">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => id && onToggleRow(id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#007bff] focus:ring-[#007bff]/30"
                        aria-label={`Select ${displayName}`}
                      />
                    </td>
                    <td className="px-3 py-4 align-middle">
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
                              unknown ? 'bg-gray-400' : 'bg-blue-600'
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
                    <td className="px-3 py-4 align-middle text-sm text-gray-600 whitespace-nowrap">
                      {formatUsDate(row?.createdAt)}
                    </td>
                    <td className="px-3 py-4 align-middle text-sm text-gray-900">
                      {collaborationContent(row)}
                    </td>
                    <td className="px-3 py-4 align-middle text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(row?.gigId?.gigcompletionAmount)}
                    </td>
                    <td className="px-3 py-4 align-middle text-right text-sm font-semibold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(row?.gigId?.gigSuccessAmount)}
                    </td>
                    <td className="px-3 py-4 align-middle text-right">
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
    </div>
  );
}

export function OwedPaginationBar({
  page,
  totalPages,
  total,
  loading,
  onFirst,
  onPrev,
  onNext,
  onLast
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-0.5">
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages}
        {total != null ? (
          <>
            <span className="text-gray-300"> </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-300"> </span>
            <span className="text-gray-500">{total} total</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onFirst}
          disabled={!canPrev || loading}
          className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="First page"
        >
          &lt;&lt;
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev || loading}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext || loading}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onLast}
          disabled={!canNext || loading}
          className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Last page"
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  );
}
