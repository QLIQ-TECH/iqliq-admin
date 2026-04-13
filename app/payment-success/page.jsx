'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Stripe success_url often points here. We send the user to Creators Payment → Owed
 * with gig_pay=success so the same success modal runs as for the in-app return URL.
 */
export default function PaymentSuccessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const search =
      typeof window !== 'undefined' ? window.location.search : '';
    const incoming = new URLSearchParams(search);
    const sessionId = incoming.get('session_id');
    const next = new URLSearchParams();
    next.set('gig_pay', 'success');
    if (sessionId) next.set('session_id', sessionId);
    router.replace(
      `/vendor/creators-payment/owed?${next.toString()}`
    );
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-600">Taking you to Creators Payment…</p>
    </div>
  );
}
