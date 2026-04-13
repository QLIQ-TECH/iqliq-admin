'use client';

import { useCallback, useEffect, useState } from 'react';
import CreatorsPaymentShell from '../../../../components/creators-payment/CreatorsPaymentShell';
import CreatorOwedTable, {
  OwedPaginationBar
} from '../../../../components/creators-payment/CreatorOwedTable';
import PaymentSummaryDrawer from '../../../../components/creators-payment/review-pay-drawer/PaymentSummaryDrawer';
import GigPaymentResultModal from '../../../../components/creators-payment/GigPaymentResultModal';
import gigsService from '../../../../lib/services/gigsService';
import {
  createGigMultiplePaymentSession,
  redirectToGigPaymentCheckout
} from '../../../../lib/services/gigPaymentService';

const LIMIT = 10;

export default function CreatorsPaymentOwedPage() {
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1
  });
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [drawerAssignments, setDrawerAssignments] = useState([]);
  const [resultModal, setResultModal] = useState({ open: false, variant: 'success' });

  const fetchPage = useCallback(async (pageToLoad = 1) => {
    try {
      setTableLoading(true);
      const response = await gigsService.getCreatorsOwedQueue({
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
        totalPages: Number(pag.totalPages ?? 1) || 1
      });
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Creators owed fetch failed:', e);
      setRows([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 1,
        page: 1
      }));
      setSelectedIds(new Set());
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  /** Stripe return: show modal and strip query (no separate success page). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('gig_pay');
    if (!q) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (q === 'success') {
      setResultModal({ open: true, variant: 'success' });
      fetchPage(1);
    } else if (q === 'cancel') {
      setResultModal({ open: true, variant: 'cancel' });
    }
  }, [fetchPage]);

  const toggleRow = useCallback((id) => {
    const key = String(id ?? '');
    if (!key) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const ids = rows
      .map((r) => String(r?._id ?? ''))
      .filter(Boolean);
    setSelectedIds((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(ids);
    });
  }, [rows]);

  const handleReviewAndPay = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selected = rows.filter((r) => selectedIds.has(String(r?._id ?? '')));
    if (selected.length === 0) return;
    setDrawerAssignments(selected);
    setPaymentDrawerOpen(true);
  }, [rows, selectedIds]);

  const handleDrawerStripePay = useCallback(async ({ assignments }) => {
    const res = await createGigMultiplePaymentSession(assignments);
    redirectToGigPaymentCheckout(res);
  }, []);

  return (
    <CreatorsPaymentShell
      title="Owed"
      description="Accepted collaborations that are still unpaid. Select rows and use Review & Pay."
    >
      <div className="relative">
        {tableLoading && !loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-5 w-5 border-2 border-[#007bff] border-t-transparent rounded-full animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <CreatorOwedTable
          rows={rows}
          loading={loading}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onReviewAndPay={handleReviewAndPay}
          reviewPayDisabled={selectedIds.size === 0}
        />
      </div>

      <OwedPaginationBar
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        loading={tableLoading}
        onFirst={() => fetchPage(1)}
        onPrev={() => fetchPage(Math.max(1, pagination.page - 1))}
        onNext={() =>
          fetchPage(Math.min(pagination.totalPages, pagination.page + 1))
        }
        onLast={() => fetchPage(pagination.totalPages)}
      />

      <PaymentSummaryDrawer
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        assignments={drawerAssignments}
        onPay={handleDrawerStripePay}
      />

      <GigPaymentResultModal
        open={resultModal.open}
        variant={resultModal.variant}
        onClose={() => setResultModal((s) => ({ ...s, open: false }))}
      />
    </CreatorsPaymentShell>
  );
}
