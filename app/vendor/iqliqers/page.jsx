'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import gigsService from '../../../lib/services/gigsService';
import walletService from '../../../lib/services/walletService';
import socialService from '../../../lib/services/socialService';
import { Users2 } from 'lucide-react';

function formatQoynExpiryNote(expiryIso) {
  if (!expiryIso) return 'Qoyn expiry date not available';
  try {
    const end = new Date(expiryIso);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const days = Math.ceil(diffMs / 86400000);
    const dateStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(end);
    if (days < 0) return `Expired on ${dateStr}`;
    if (days === 0) return 'Expires today';
    return `Expires in ${days} day${days === 1 ? '' : 's'} · ${dateStr}`;
  } catch {
    return 'Qoyn expiry date not available';
  }
}

function StatCard({ title, leftValue, leftLabel, rightValue, rightLabel }) {
  return (
    <div className="flex-1 min-w-[240px] rounded-xl border border-[#D7E8FF] bg-white px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-semibold text-gray-900">{title}</div>
        <div className="h-7 w-7 rounded-full border border-[#D7E8FF] bg-white flex items-center justify-center">
          <Users2 className="h-4 w-4 text-[#0A76FF]" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-8">
        <div>
          <div className="text-[36px] leading-[36px] font-semibold text-gray-900">{leftValue}</div>
          <div className="mt-2 text-[11px] font-semibold text-gray-500">{leftLabel}</div>
        </div>
        <div>
          <div className="text-[36px] leading-[36px] font-semibold text-gray-900">{rightValue}</div>
          <div className="mt-2 text-[11px] font-semibold text-gray-500">{rightLabel}</div>
        </div>
      </div>
    </div>
  );
}

function WalletCard({ title, value, note }) {
  return (
    <div className="flex-1 min-w-[240px] rounded-xl border border-[#D7E8FF] bg-white px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-semibold text-gray-900">{title}</div>
        <div className="h-7 w-7 rounded-full border border-[#D7E8FF] bg-white flex items-center justify-center">
          <Users2 className="h-4 w-4 text-[#0A76FF]" />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[36px] leading-[36px] font-semibold text-gray-900">{value}</div>
        <div className="mt-2 text-[11px] font-semibold text-gray-500">{note}</div>
      </div>
    </div>
  );
}

export default function VendorIqliqersPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partnerCount, setPartnerCount] = useState(0);
  const [partnersLast30, setPartnersLast30] = useState(0);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'superadmin') {
      router.push('/admin');
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading || !user || user.role !== 'vendor') return;

    let cancelled = false;
    (async () => {
      setPartnersLoading(true);
      try {
        const res = await gigsService.getBrandPartnerAssignments();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setPartnerCount(typeof res?.count === 'number' ? res.count : list.length);
        setPartnersLast30(typeof res?.lastThirtyDays === 'number' ? res.lastThirtyDays : 0);
      } catch {
        if (!cancelled) {
          setPartnerCount(0);
          setPartnersLast30(0);
        }
      } finally {
        if (!cancelled) setPartnersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  useEffect(() => {
    if (isLoading || !user || user.role !== 'vendor') return;

    let cancelled = false;
    (async () => {
      setFollowersLoading(true);
      try {
        const res = await socialService.getFollowers();
        if (cancelled) return;
        if (res?.success === false) {
          throw new Error(res?.message || 'Could not load followers.');
        }
        const total =
          typeof res?.data?.pagination?.totalCount === 'number'
            ? res.data.pagination.totalCount
            : Array.isArray(res?.data?.followers)
              ? res.data.followers.length
              : 0;
        setFollowersTotal(total);
      } catch {
        if (!cancelled) setFollowersTotal(0);
      } finally {
        if (!cancelled) setFollowersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  useEffect(() => {
    if (isLoading || !user || user.role !== 'vendor') return;

    let cancelled = false;
    (async () => {
      setWalletLoading(true);
      setWalletError('');
      try {
        const res = await walletService.getUserWalletInfo();
        if (cancelled) return;
        if (res?.status === false) {
          throw new Error(res?.message || 'Could not load wallet.');
        }
        const w = res?.data?.wallet;
        if (!w) {
          throw new Error(res?.message || 'Wallet data missing.');
        }
        setWalletData(w);
      } catch (e) {
        if (!cancelled) {
          setWalletError(e?.message || 'Could not load wallet.');
          setWalletData(null);
        }
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const walletBalanceDisplay = useMemo(() => {
    if (walletLoading) return '—';
    if (walletError || !walletData) return '—';
    const n = Number(walletData.actualQoyn ?? 0);
    return Number.isFinite(n) ? n.toLocaleString() : '0';
  }, [walletLoading, walletError, walletData]);

  const walletNoteDisplay = useMemo(() => {
    if (walletLoading) return 'Loading wallet…';
    if (walletError) return walletError;
    if (!walletData) return 'No wallet data.';
    return formatQoynExpiryNote(walletData.qoynExpiryDate);
  }, [walletLoading, walletError, walletData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        userType="vendor"
        onLogout={logout}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMenuClick={toggleSidebar} userType="vendor" user={user} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-[28px] font-semibold text-gray-900">My IQliqers</h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <StatCard
              title="Influencer"
              leftValue={partnersLoading ? '—' : String(partnerCount)}
              leftLabel="Current Influencer Partners"
              rightValue={partnersLoading ? '—' : String(partnersLast30)}
              rightLabel="New Influencers (past 30 days)"
            />
            <StatCard
              title="Followers"
              leftValue={followersLoading ? '—' : String(followersTotal)}
              leftLabel="Current Followers"
              rightValue={followersLoading ? '—' : String(followersTotal)}
              rightLabel="New Followers (past 30 days)"
            />
            <WalletCard
              title="My Qoyns Wallet"
              value={walletBalanceDisplay}
              note={walletNoteDisplay}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="h-8 rounded-full bg-[#0A76FF] px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(10,118,255,0.22)]"
            >
              My Qoyns Wallet
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 h-9 rounded-full border border-[#D7E8FF] bg-white px-4 text-[12px] font-semibold text-[#0A76FF]"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#D7E8FF]">
                <span className="block h-2 w-2 rounded-full bg-[#0A76FF]" />
              </span>
              Send Qoyn
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[#D7E8FF] bg-white overflow-hidden">
            <div className="grid grid-cols-12 bg-[#0A76FF] px-4 py-3 text-[11px] font-semibold text-white">
              <div className="col-span-5">DESCRIPTION</div>
              <div className="col-span-2 text-center">QOYN</div>
              <div className="col-span-3 text-center">DATE</div>
              <div className="col-span-2 text-right">STATUS</div>
            </div>

            <div className="px-4 py-10 text-center text-[12px] font-medium text-gray-500">No results.</div>
          </div>
        </main>
      </div>
    </div>
  );
}

