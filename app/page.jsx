'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const enableAdminLogin = process.env.NEXT_PUBLIC_ENABLE_ADMIN_LOGIN === 'true';

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.role === 'vendor' && user.onboardingCompleted === false) {
      window.location.assign('/onboarding');
      return;
    }
    if (user.role === 'superadmin') {
      router.replace('/admin');
    } else if (user.role === 'vendor') {
      router.replace('/vendor');
    }
  }, [user, isLoading, router]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
              <span className="text-white font-bold text-2xl">Q</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">QLIQ</h1>
            <p className="text-gray-600 mt-1">Choose where to sign in</p>
          </div>

          <div className="space-y-3">
            {enableAdminLogin && (
              <a
                href="/login"
                className="block w-full text-center py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Admin Login
              </a>
            )}

            <a
              href="/onboarding/login"
              className="block w-full text-center py-3 px-4 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Vendor Onboarding
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
