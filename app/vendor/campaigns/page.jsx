'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  DollarSign,
  Eye,
  MousePointer2,
  LineChart,
  X,
  Calendar,
  ShoppingCart,
  Wallet,
  Percent
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import gigsService from '../../../lib/services/gigsService';

const PRIMARY = '#007BFF';

function buildCampaignDetailHref(row) {
  const qs = new URLSearchParams();
  if (row.title) qs.set('title', row.title);
  if (row.startDate) qs.set('start', row.startDate);
  if (row.endDate) qs.set('end', row.endDate);
  const q = qs.toString();
  return `/vendor/campaigns/${row._id}${q ? `?${q}` : ''}`;
}

function formatTableDate(value) {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return String(value);
  }
}

function formatMoney(value) {
  const num = Number(value ?? 0);
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Compact number: 6.34M, 982K */
function formatCompactNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return '0';
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    const s = m >= 10 ? m.toFixed(1) : m.toFixed(2);
    return `${parseFloat(s)}M`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    const s = k >= 100 ? k.toFixed(0) : k.toFixed(2);
    return `${parseFloat(s)}K`;
  }
  return String(Math.round(num));
}

function formatPctCTR(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function formatRoi(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}x`;
}

function StatusBadge({ status }) {
  const raw = String(status ?? '—');
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
      {raw}
    </span>
  );
}

/** Match API sample: dates at 18:30:00.000Z */
function dateInputToIso(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return `${dateStr}T18:30:00.000Z`;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#007BFF] focus:outline-none focus:ring-2 focus:ring-[#007BFF]/25';

function CreateCampaignModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setBudget('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setError('');
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedTitle = title.trim();
    const budgetNum = Number(String(budget).replace(/,/g, ''));
    if (!trimmedTitle) {
      setError('Campaign name is required.');
      return;
    }
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError('Enter a valid budget greater than 0.');
      return;
    }
    const startIso = dateInputToIso(startDate);
    const endIso = dateInputToIso(endDate);
    if (!startIso || !endIso) {
      setError('Please select both start and end dates.');
      return;
    }
    if (new Date(endIso) < new Date(startIso)) {
      setError('End date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim() || '',
        budget: budgetNum,
        startDate: startIso,
        endDate: endIso
      };
      const res = await gigsService.createCampaign(payload);
      if (res?.success) {
        onCreated?.();
        onClose();
      } else {
        setError(res?.message || 'Could not create campaign.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        aria-hidden
        onClick={submitting ? undefined : onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-campaign-title"
          className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <h2
              id="create-campaign-title"
              className="text-xl font-bold text-gray-900 tracking-tight"
            >
              Create New Campaign
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="campaign-title"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Campaign Name
              </label>
              <input
                id="campaign-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Brand Push"
                className={inputClass}
                autoComplete="off"
                disabled={submitting}
              />
            </div>

            <div>
              <label
                htmlFor="campaign-budget"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Budget ($)
              </label>
              <input
                id="campaign-budget"
                type="text"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="15000"
                className={inputClass}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
              <div>
                <label
                  htmlFor="campaign-start"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Start Date
                </label>
                <div className="relative">
                  <input
                    id="campaign-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${inputClass} pr-2 [color-scheme:light]`}
                    disabled={submitting}
                  />
                  {/* <Calendar
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    strokeWidth={1.75}
                  /> */}
                </div>
              </div>
              <div>
                <label
                  htmlFor="campaign-end"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  End Date
                </label>
                <div className="relative">
                  <input
                    id="campaign-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${inputClass} pr-2 [color-scheme:light]`}
                    disabled={submitting}
                    min={startDate || undefined}
                  />
                  {/* <Calendar
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    strokeWidth={1.75}
                  /> */}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="campaign-description"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Description{' '}
                <span className="font-normal text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="campaign-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief campaign overview..."
                className={`${inputClass} resize-y min-h-[100px]`}
                disabled={submitting}
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-row flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-gray-900 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}
              >
                {submitting ? 'Creating…' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, changePct, Icon }) {
  const showChange = changePct != null && Number.isFinite(changePct);
  const safe = showChange ? changePct : 0;
  const positive = safe >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 relative min-h-[112px]">
      <div className="absolute top-4 right-4 text-gray-400">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase pr-10">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      {showChange ? (
        <div
          className={`mt-1 text-sm font-semibold tabular-nums ${
            positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {positive ? '+' : ''}
          {safe.toFixed(1)}%
        </div>
      ) : null}
    </div>
  );
}

export default function VendorCampaignsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const LIMIT = 10;

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  /** GET /campaigns/brand/overview-stats */
  const [overviewStats, setOverviewStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  const loadOverviewStats = useCallback(async () => {
    try {
      const res = await gigsService.getBrandCampaignOverviewStats();
      if (res?.success && res?.data) setOverviewStats(res.data);
      else setOverviewStats(null);
    } catch (e) {
      console.error(e);
      setOverviewStats(null);
    }
  }, []);

  const loadCampaigns = useCallback(
    async (pageToLoad = 1) => {
      setTableLoading(true);
      try {
        const res = await gigsService.getBrandCampaigns({
          page: pageToLoad,
          limit: LIMIT
        });
        const list = res?.data || [];
        const pag = res?.pagination || {};
        setCampaigns(Array.isArray(list) ? list : []);
        setPagination({
          page: Number(pag.currentPage ?? pageToLoad) || pageToLoad,
          limit: LIMIT,
          total: Number(pag.totalItems ?? list.length) || list.length,
          totalPages: Number(pag.totalPages ?? 1) || 1
        });

      } catch (e) {
        console.error(e);
        setCampaigns([]);
        setPagination((p) => ({ ...p, total: 0, totalPages: 1, page: 1 }));
      } finally {
        setTableLoading(false);
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isLoading || user?.role !== 'vendor') return;
    loadCampaigns(1);
    loadOverviewStats();
  }, [isLoading, user?.role, loadCampaigns, loadOverviewStats]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#007BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5f7fa]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userType="vendor"
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userType="vendor"
          user={user}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Active performance across 4 channels
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm shrink-0"
                style={{ backgroundColor: PRIMARY }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                New Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
              <StatCard
                title="Total Spend"
                value={formatMoney(overviewStats?.totalSpend ?? 0)}
                Icon={DollarSign}
              />
              <StatCard
                title="Impressions"
                value={
                  overviewStats?.impressions != null &&
                  Number.isFinite(Number(overviewStats.impressions))
                    ? formatCompactNumber(overviewStats.impressions)
                    : '—'
                }
                Icon={Eye}
              />
              <StatCard
                title="Avg. CTR"
                value={formatPctCTR(overviewStats?.avgCTR)}
                Icon={MousePointer2}
              />
              <StatCard
                title="Avg. ROI"
                value={formatRoi(overviewStats?.avgROI)}
                Icon={LineChart}
              />
            </div>
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Total Purchases"
                value={String(overviewStats?.totalPurchases ?? 0)}
                Icon={ShoppingCart}
              />
              <StatCard
                title="Est. Gross Profit"
                value={formatMoney(overviewStats?.estimatedGrossProfit ?? 0)}
                Icon={Wallet}
              />
              <StatCard
                title="Margin"
                value={`${Number(overviewStats?.marginPct ?? 0).toFixed(0)}%`}
                Icon={Percent}
              />
            </div> */}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative">
                {tableLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <div
                        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }}
                      />
                      Loading…
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: PRIMARY }}>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5 rounded-tl-xl">
                          Campaign Name
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Description
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Budget ($)
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Start Date
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          End Date
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Status
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5 rounded-tr-xl">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.length === 0 && !tableLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                            No campaigns found.
                          </td>
                        </tr>
                      ) : (
                        campaigns.map((row) => (
                          <tr
                            key={row._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(buildCampaignDetailHref(row))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                router.push(buildCampaignDetailHref(row));
                              }
                            }}
                            className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer"
                          >
                            <td className="px-4 py-4 text-gray-900 font-medium">
                              {row.title || '—'}
                            </td>
                            <td className="px-4 py-4 text-gray-900 max-w-[240px]">
                              {row.description || '—'}
                            </td>
                            <td className="px-4 py-4 text-gray-900 tabular-nums">
                              {formatMoney(row.budget)}
                            </td>
                            <td className="px-4 py-4 text-gray-800 whitespace-nowrap">
                              {formatTableDate(row.startDate)}
                            </td>
                            <td className="px-4 py-4 text-gray-800 whitespace-nowrap">
                              {formatTableDate(row.endDate)}
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="px-4 py-4 text-gray-800 whitespace-nowrap">
                              {formatTableDate(row.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages} · Total {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadCampaigns(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1 || tableLoading}
                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      loadCampaigns(
                        Math.min(pagination.totalPages, pagination.page + 1)
                      )
                    }
                    disabled={
                      pagination.page >= pagination.totalPages || tableLoading
                    }
                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateCampaignModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          loadCampaigns(1);
          loadOverviewStats();
        }}
      />
    </div>
  );
}
