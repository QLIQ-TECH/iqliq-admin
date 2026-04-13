'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Users,
  DollarSign,
  Eye,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import Modal from '../../../../components/shared/Modal';
import CreateGigDrawer from '../../../../components/createGig/CreateGigDrawer';
import gigsService from '../../../../lib/services/gigsService';

const PRIMARY = '#007BFF';
const LIMIT = 10;

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

function formatHeaderDateRange(startIso, endIso) {
  if (!startIso || !endIso) return null;
  try {
    const d1 = new Date(startIso);
    const d2 = new Date(endIso);
    const fmt = (d) =>
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    return `${fmt(d1)} – ${fmt(d2)}`;
  } catch {
    return null;
  }
}

function formatMoney(value) {
  const num = Number(value ?? 0);
  return `$${num.toLocaleString()}`;
}

function getAccountLabel(row) {
  const influencer = row?.influencerId;
  if (influencer) {
    return influencer.name || influencer.email || influencer._id || '-';
  }
  return row?.brandId?.nationality || '-';
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
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${colorClass}`}
    >
      {label}
    </span>
  );
}

function AmountCell({ row }) {
  const gigAmount = row?.gigId?.gigcompletionAmount ?? 0;
  const bonusAmount = row?.gigId?.gigSuccessAmount ?? 0;
  return (
    <div className="space-y-3 text-left">
      <div>
        <div className="text-xs text-gray-500 mb-1">Gig Amount</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{formatMoney(gigAmount)}</span>
          {getPaymentBadge(row?.gigCompletionpaymentStatus)}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Bonus Amount</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{formatMoney(bonusAmount)}</span>
          {getPaymentBadge(row?.gigSuccesspaymentStatus)}
        </div>
      </div>
    </div>
  );
}

function StatusCell({ row }) {
  const label = row?.taskProgress || row?.influencerApprovalStatus || 'Pending';
  return (
    <div className="flex justify-center">
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        {label}
      </span>
    </div>
  );
}

function avatarStyle(seed) {
  const hues = [210, 160, 280, 340, 200, 30];
  let h = 0;
  const s = String(seed || 'x');
  for (let i = 0; i < s.length; i++) h += s.charCodeAt(i);
  const hue = hues[h % hues.length];
  return { backgroundColor: `hsl(${hue} 65% 45%)` };
}

function GigReportModal({ open, onClose, gig }) {
  if (!open || !gig) return null;
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
            <div className="font-medium text-gray-900">{formatTableDate(gig?.createdAt)}</div>
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
      </div>
    </Modal>
  );
}

function StatCard({ title, value, Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 relative min-h-[100px]">
      <div className="absolute top-4 right-4 text-gray-400">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase pr-10">
        {title}
      </div>
      <div className="mt-3 text-3xl font-bold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}

export default function CampaignDetailView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = params?.id;

  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [createGigOpen, setCreateGigOpen] = useState(false);

  const titleFromQuery = searchParams.get('title') || '';
  const startFromQuery = searchParams.get('start') || '';
  const endFromQuery = searchParams.get('end') || '';

  const displayTitle = titleFromQuery.trim() || 'Campaign';
  const dateRangeLabel = formatHeaderDateRange(startFromQuery, endFromQuery);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  const loadStats = useCallback(async () => {
    if (!campaignId) return;
    const res = await gigsService.getCampaignStats(campaignId);
    if (res?.success && res?.data) setStats(res.data);
    else setStats(null);
  }, [campaignId]);

  const loadGigs = useCallback(
    async (pageToLoad = 1) => {
      if (!campaignId) return;
      setTableLoading(true);
      try {
        const res = await gigsService.getCampaignGigs(campaignId, {
          page: pageToLoad,
          limit: LIMIT
        });
        const list = res?.data || [];
        const pag = res?.pagination || {};
        setGigs(Array.isArray(list) ? list : []);
        setPagination({
          page: Number(pag.page ?? pageToLoad) || pageToLoad,
          limit: Number(pag.limit ?? LIMIT) || LIMIT,
          total: Number(pag.total ?? list.length) || list.length,
          totalPages: Number(pag.totalPages ?? 1) || 1
        });
      } catch (e) {
        console.error(e);
        setGigs([]);
        setPagination((p) => ({ ...p, total: 0, totalPages: 1 }));
      } finally {
        setTableLoading(false);
        setLoading(false);
      }
    },
    [campaignId]
  );

  useEffect(() => {
    if (isLoading || user?.role !== 'vendor' || !campaignId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadStats();
      } catch (e) {
        console.error(e);
      }
      if (!cancelled) await loadGigs(1);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user?.role, campaignId, loadStats, loadGigs]);

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

  const totalGigs = stats?.totalGigs ?? 0;
  const activeGigs = stats?.activeGigs ?? 0;
  const delivered = stats?.completedAssignments ?? stats?.completedGigs ?? 0;
  const budgetUsedRaw = stats?.budgetUsed ?? 0;

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
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/vendor/campaigns');
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#007BFF] mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Campaigns
            </button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{displayTitle}</h1>
                  <span className="text-xs font-semibold text-green-800 bg-green-100 px-2.5 py-1 rounded-md">
                    ACTIVE
                  </span>
                </div>
                {dateRangeLabel && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{dateRangeLabel}</span>
                    </span>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Instagram', 'Tik Tok', 'Youtube'].map((p) => (
                    <span
                      key={p}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateGigOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm shrink-0"
                style={{ backgroundColor: PRIMARY }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add Gig
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Gigs" value={totalGigs} Icon={Users} />
              <StatCard title="Active Gigs" value={activeGigs} Icon={DollarSign} />
              <StatCard title="Delivered" value={delivered} Icon={Eye} />
              <StatCard
                title="Budget Used"
                value={Number(budgetUsedRaw).toLocaleString()}
                Icon={TrendingUp}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Account
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Date
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Type
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Description
                        </th>
                        <th className="text-left text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Amount
                        </th>
                        <th className="text-center text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Status
                        </th>
                        <th className="text-center text-white font-semibold uppercase text-xs tracking-wide px-4 py-3.5">
                          Report
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {gigs.length === 0 && !tableLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                            No gigs found for this campaign.
                          </td>
                        </tr>
                      ) : (
                        gigs.map((row) => {
                          const name = getAccountLabel(row);
                          const initial = (name && name[0] ? name[0] : '?').toUpperCase();
                          const gigTitle = row?.gigId?.title || '—';
                          return (
                            <tr
                              key={row._id}
                              className="border-b border-gray-100 hover:bg-gray-50/80"
                            >
                              <td className="px-4 py-4 align-top">
                                <div className="flex items-start gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                    style={avatarStyle(row?.influencerId?._id || name)}
                                  >
                                    {initial}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-gray-900 leading-tight">
                                      {gigTitle}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5 capitalize">
                                      {name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top text-gray-800 whitespace-nowrap">
                                {formatTableDate(row?.createdAt)}
                              </td>
                              <td className="px-4 py-4 align-top text-gray-900">
                                {row?.gigId?.typeOfGig || '—'}
                              </td>
                              <td className="px-4 py-4 align-top text-gray-900 max-w-[220px]">
                                {row?.gigId?.description || '—'}
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AmountCell row={row} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <StatusCell row={row} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGig(row);
                                      setReportOpen(true);
                                    }}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-[#007BFF] bg-blue-50 hover:bg-blue-100 transition-colors"
                                    title="View report"
                                  >
                                    {Number(row?.completionCount ?? 0)}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
                    onClick={() => loadGigs(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1 || tableLoading}
                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      loadGigs(Math.min(pagination.totalPages, pagination.page + 1))
                    }
                    disabled={pagination.page >= pagination.totalPages || tableLoading}
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

      <CreateGigDrawer
        open={createGigOpen}
        onClose={() => setCreateGigOpen(false)}
        campaignId={campaignId}
        onGigCreated={() => {
          loadStats();
          loadGigs(pagination.page);
        }}
        onViewGigs={() => {
          loadStats();
          loadGigs(pagination.page);
        }}
      />

      <GigReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        gig={selectedGig}
      />
    </div>
  );
}
