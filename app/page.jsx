'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'vendor' && user.onboardingCompleted === false && !user.vendorId) {
      router.replace('/onboarding/virtual-assitance');
      return;
    }
    if (user.role === 'superadmin') {
      router.replace('/superadmin/user');
    } else if (user.role === 'vendor') {
      router.replace('/vendor');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{isLoading ? 'Loading...' : 'Redirecting...'}</p>
      </div>
    </div>
  );
}
