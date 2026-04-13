'use client';

import { useCallback, useEffect, useState } from 'react';
import CreatorsPaymentShell from '../../../../components/creators-payment/CreatorsPaymentShell';
import CreatorPaymentsTable from '../../../../components/creators-payment/CreatorPaymentsTable';
import gigsService from '../../../../lib/services/gigsService';

const LIMIT = 10;

export default function CreatorsPaymentPaymentPage() {
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchPage = useCallback(async (pageToLoad = 1) => {
    try {
      setTableLoading(true);
      const response = await gigsService.getCreatorsPaymentQueue({
        page: pageToLoad,
        limit: LIMIT
      });

      const list = response?.data || [];
      const pag = response?.pagination || {};

      setRows(list);
      setPagination({
        page: Number(pag.page ?? pageToLoad) || pageToLoad,
        limit: Number(pag.limit ?? LIMIT) || LIMIT,
        total: Number(pag.total ?? list.length) || list.length,
        totalPages: Number(pag.totalPages ?? 1) || 1,
        hasNextPage: Boolean(pag.hasNextPage),
        hasPrevPage: Boolean(pag.hasPrevPage)
      });
    } catch (e) {
      console.error('Creators payment fetch failed:', e);
      setRows([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }));
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return (
    <CreatorsPaymentShell
      title="Payment"
      description="Pending creator assignments awaiting payment."
    >
      <div className="relative">
        {tableLoading && !loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-5 w-5 border-2 border-[#0084FF] border-t-transparent rounded-full animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <CreatorPaymentsTable rows={rows} loading={loading} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages}
          <span className="text-gray-400"> · </span>
          {pagination.total} total
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchPage(Math.max(1, pagination.page - 1))}
            disabled={
              loading ||
              tableLoading ||
              pagination.page <= 1 ||
              pagination.totalPages <= 1
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              fetchPage(Math.min(pagination.totalPages, pagination.page + 1))
            }
            disabled={
              loading ||
              tableLoading ||
              pagination.page >= pagination.totalPages ||
              pagination.totalPages <= 1
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </CreatorsPaymentShell>
  );
}
