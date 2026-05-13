'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ReferralPanel from '../../../components/referral/ReferralPanel';

export default function AdminReferralPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user && user.role === 'vendor') {
      router.push('/vendor/referral');
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    let cancelled = false;
    async function loadReferral() {
      if (!user) return;
      setReferralLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://backendamp.qliq.ae/api/users/amp-details', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        const code = json?.data?.referralCode;
        if (!res.ok) throw new Error(json?.message || 'Failed to load referral details');
        if (!code) throw new Error('Referral code missing');
        if (!cancelled) setReferralCode(code);
      } catch (e) {
        if (!cancelled) setReferralCode('');
        toast.error(e?.message || 'Failed to load referral details');
      } finally {
        if (!cancelled) setReferralLoading(false);
      }
    }
    if (user?.role === 'superadmin') loadReferral();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

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

  if (!user || user.role !== 'superadmin') {
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
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} userType="superadmin" onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMenuClick={toggleSidebar} userType="superadmin" user={user} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-5xl">
            <ReferralPanel
              loading={referralLoading}
              referralCode={referralCode}
              referralUrl={referralCode ? `https://live.iqliq.ae/redirect?referralCode=${referralCode}` : ''}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

