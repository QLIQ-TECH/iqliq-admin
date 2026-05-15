'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import Modal from '../../../components/shared/Modal';
import CreateGigDrawer from '../../../components/createGig/CreateGigDrawer';
import gigsService from '../../../lib/services/gigsService';

function formatDate(value) {
  if (!value) return '-';
  try {
    // Show date only (e.g. "23 March 2026") without time.
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return String(value);
  }
}

function getAccountLabel(row) {
  const influencer = row?.influencerId;
  if (influencer) {
    return influencer.name || influencer.email || influencer._id || '-';
  }
  const nationality = row?.brandId?.nationality;
  return nationality || row?.brandId?._id || '-';
}

function getAmountLabel(row) {
  // Deprecated: kept only for backward compatibility if used elsewhere.
  const completion = Number(row?.gigId?.gigcompletionAmount ?? 0);
  return completion ? `${completion}` : '0';
}

function formatMoney(value) {
  const num = Number(value ?? 0);
  return `$${num.toLocaleString()}`;
}

function getPaymentBadge(status) {
  const raw = String(status ?? '');
  const isPaid = raw.toLowerCase() === 'paid';

  const colorClass = isPaid
    ? 'bg-green-100 text-green-800'
    : raw.toLowerCase() === 'unpaid'
      ? 'bg-gray-200 text-gray-800'
      : 'bg-gray-100 text-gray-700';

  const label = raw || 'UnPaid';

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${colorClass}`}
    >
      {label}
    </span>
  );
}

function getAmountCell(row) {
  const gigAmount = row?.gigId?.gigcompletionAmount ?? 0;
  const bonusAmount = row?.gigId?.gigSuccessAmount ?? 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-500 text-sm">Gig Amount</span>
        {getPaymentBadge(row?.gigCompletionpaymentStatus)}
      </div>
      <div className="font-medium text-gray-900">{formatMoney(gigAmount)}</div>

      <div className="flex items-center justify-between gap-3 mt-2">
        <span className="text-gray-500 text-sm">Bonus Amount</span>
        {getPaymentBadge(row?.gigSuccesspaymentStatus)}
      </div>
      <div className="font-medium text-gray-900">{formatMoney(bonusAmount)}</div>
    </div>
  );
}

function getStatusBadge(row) {
  const approval = row?.influencerApprovalStatus || '-';
  const progress = row?.taskProgress || '-';

  // Color coding based on approval status
  const colorClass =
    approval === 'Approved'
      ? 'bg-green-100 text-green-800'
      : approval === 'Pending'
        ? 'bg-yellow-100 text-yellow-800'
        : approval === 'Rejected'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800';

  return (
    <div className="flex flex-col">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${colorClass}`}>
        {approval}
      </span>
      <span className="text-xs text-gray-500 mt-1">{progress}</span>
    </div>
  );
}

function GigReportModal({ open, onClose, gig }) {
  if (!open) return null;
  if (!gig) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title="Gig Report" size="xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {gig?.gigId?.title || 'Untitled Gig'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Assigned: {getAccountLabel(gig)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Date</div>
            <div className="font-medium text-gray-900">{formatDate(gig?.createdAt)}</div>
          </div>
          <div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium text-gray-900">{gig?.gigId?.typeOfGig || '-'}</div>
          </div>
        </div>

        <div>
          <div className="text-gray-500 text-sm">Description</div>
          <div className="text-gray-900 whitespace-pre-line">{gig?.gigId?.description || '-'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-sm">Gig Amount</span>
              {getPaymentBadge(gig?.gigCompletionpaymentStatus)}
            </div>
            <div className="font-medium text-gray-900 mt-1">
              {formatMoney(gig?.gigId?.gigcompletionAmount ?? 0)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-sm">Bonus Amount</span>
              {getPaymentBadge(gig?.gigSuccesspaymentStatus)}
            </div>
            <div className="font-medium text-gray-900 mt-1">
              {formatMoney(gig?.gigId?.gigSuccessAmount ?? 0)}
            </div>
          </div>
        </div>

        <div>
          <div className="text-gray-500 text-sm">Influencer Approval</div>
          <div className="font-medium text-gray-900">{gig?.influencerApprovalStatus || '-'}</div>
        </div>

        <div>
          <div className="text-gray-500 text-sm">Referral Code</div>
          <div className="font-medium text-gray-900">{gig?.referralCode || '-'}</div>
        </div>
      </div>
    </Modal>
  );
}

export default function VendorGigsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateGigDrawerOpen, setIsCreateGigDrawerOpen] = useState(false);

  const LIMIT = 10;

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
  }, [user, isLoading, router]);

  const fetchGigs = async (pageToLoad = 1) => {
    try {
      setTableLoading(true);

      const response = await gigsService.getGigAssignments({
        status: '',
        paymentStatus: '',
        page: pageToLoad,
        limit: LIMIT
      });

      const list = response?.data || [];
      const pag = response?.pagination || {};

      setGigs(list);
      setPagination({
        page: Number(pag.page ?? pageToLoad) || pageToLoad,
        limit: Number(pag.limit ?? LIMIT) || LIMIT,
        total: Number(pag.total ?? list.length) || list.length,
        totalPages: Number(pag.totalPages ?? pag.pages ?? 1) || 1
      });
    } catch (error) {
      console.error('Error fetching gigs:', error);
      setGigs([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user?.role === 'vendor') {
      fetchGigs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const columns = useMemo(
    () => [
      {
        key: 'influencerId',
        label: 'Account',
        render: (_, row) => <span className="font-medium">{getAccountLabel(row)}</span>
      },
      {
        key: 'createdAt',
        label: 'Date',
        render: (_, row) => <span>{formatDate(row?.createdAt)}</span>
      },
      {
        key: 'gigId',
        label: 'Type',
        render: (_, row) => <span className="text-gray-900">{row?.gigId?.typeOfGig || '-'}</span>
      },
      {
        key: 'gigId',
        label: 'Description',
        render: (_, row) => <span className="text-gray-900">{row?.gigId?.description || '-'}</span>
      },
      {
        key: 'gigId',
        label: 'Amount',
        render: (_, row) => getAmountCell(row)
      },
      {
        key: 'influencerApprovalStatus',
        label: 'STATUS',
        render: (_, row) => getStatusBadge(row)
      },
      {
        key: '_id',
        label: 'Report',
        render: (_, row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGig(row);
              setReportOpen(true);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-700"
            title="View gig report"
          >
            {Number(row?.completionCount ?? 0)}
          </button>
        )
      }
    ],
    []
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userType="vendor"
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userType="vendor"
          user={user}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <CreateGigDrawer
            open={isCreateGigDrawerOpen}
            onClose={() => setIsCreateGigDrawerOpen(false)}
          />

          <div className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gigs Management</h1>
                <p className="text-gray-600 mt-1">Track gig assignments and payment status</p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateGigDrawerOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                + Create Gigs
              </button>
            </div>
          </div>

          <div className="relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 text-sm">Loading gigs...</span>
                </div>
              </div>
            )}

            <DataTable
              data={gigs}
              columns={columns}
              searchable={false}
              pagination={false}
              emptyMessage="No gigs found."
            />
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages} • Total {pagination.total}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchGigs(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1 || tableLoading}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => fetchGigs(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page >= pagination.totalPages || tableLoading}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <GigReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        gig={selectedGig}
      />
    </div>
  );
}

