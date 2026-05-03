'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import storeService from '../../../../lib/services/storeService';
import { ArrowLeft, Store, MapPin, Phone, Mail, Globe, Calendar, ExternalLink } from 'lucide-react';

function extractStore(body) {
  if (!body || typeof body !== 'object') return null;
  const d = body.data;
  if (d != null && typeof d === 'object') {
    if ('_id' in d || 'name' in d || 'slug' in d) return d;
    if (typeof d.data === 'object') return d.data;
  }
  if ('_id' in body || 'name' in body || 'slug' in body) return body;
  return null;
}

/** Compare catalog owner field to JWT vendor id / user id */
function ownsStore(ownerIdRaw, vendorId, userId) {
  const want = vendorId ?? userId;
  if (!want || ownerIdRaw == null) return false;
  const ownerStr =
    typeof ownerIdRaw === 'object' && ownerIdRaw?.toString
      ? ownerIdRaw.toString()
      : String(ownerIdRaw);
  return ownerStr === String(want);
}

export default function VendorStoreDetailPage() {
  const params = useParams();
  const storeIdParam = params?.id;
  const storeId = Array.isArray(storeIdParam) ? storeIdParam[0] : storeIdParam;

  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [store, setStore] = useState(null);

  const vendorKey = user?.vendorId ?? user?.id;

  const loadStore = useCallback(async () => {
    if (!storeId) {
      setError('Invalid store.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const raw = await storeService.getStoreById(storeId);
      const doc = extractStore(raw);
      if (!doc || typeof doc !== 'object') {
        setError('Store could not be loaded.');
        setStore(null);
        return;
      }

      const allowed = ownsStore(doc.ownerId, user?.vendorId, user?.id);

      if (!allowed) {
        setError('You do not have access to this store.');
        setStore(null);
        return;
      }

      setStore(doc);
    } catch (e) {
      console.error('Store detail load failed:', e);
      setError(e.message || 'Failed to load store.');
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [storeId, user?.vendorId, user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
    if (user?.role === 'vendor' && storeId && vendorKey) {
      loadStore();
    }
  }, [authLoading, user, router, storeId, vendorKey, loadStore]);

  const addressLines = useMemo(() => {
    const a = store?.address;
    if (!a || typeof a !== 'object') return [];
    const parts = [a.street, [a.city, a.state].filter(Boolean).join(', '), a.country, a.postalCode].filter(Boolean);
    return parts;
  }, [store?.address]);

  const openPublicStorefront = () => {
    const slug = store?.slug;
    if (!slug) return;
    const base = (process.env.NEXT_PUBLIC_FRONTEND_APP_URL || '').replace(/\/$/, '');
    const url = base ? `${base}/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading…</p>
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
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} userType="vendor" user={user} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Link
              href="/vendor/store/profile"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store Profile
            </Link>
          </div>

          {loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">Loading store…</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-red-800 max-w-xl">
              {error}
              <div className="mt-4">
                <Link href="/vendor/store/profile" className="text-sm font-medium text-blue-700 hover:underline">
                  Return to list
                </Link>
              </div>
            </div>
          ) : store ? (
            <div className="max-w-4xl space-y-6">
              <div className="relative h-40 md:h-48 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                {store.banner ? (
                  <img src={store.banner} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-16 h-16 text-white/90" />
                  </div>
                )}
              </div>

              <div className="-mt-14 relative flex flex-col md:flex-row md:items-end gap-4 px-4">
                <div className="w-28 h-28 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden shrink-0">
                  {store.logo ? (
                    <img src={store.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Store className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{String(store.name || 'Store')}</h1>
                  {store.slug && (
                    <p className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="font-mono">{String(store.slug)}</span>
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {store.isTopStore ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                        Top store
                      </span>
                    ) : null}
                    {store.slug ? (
                      <button
                        type="button"
                        onClick={openPublicStorefront}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Public storefront
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Details</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{String(store.description || 'No description.')}</p>
              </div>

              {(store.phone || store.email || addressLines.length > 0) && (
                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
                  {store.phone ? (
                    <p className="flex items-start gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                      {String(store.phone)}
                    </p>
                  ) : null}
                  {store.email ? (
                    <p className="flex items-start gap-2 text-sm text-gray-700">
                      <Mail className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                      <span className="break-all">{String(store.email)}</span>
                    </p>
                  ) : null}
                  {addressLines.length > 0 ? (
                    <p className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                      <span>{addressLines.join(' · ')}</span>
                    </p>
                  ) : null}
                </div>
              )}

              {(store.createdAt || store.updatedAt) && (
                <div className="rounded-xl bg-gray-100/80 border border-gray-200 p-4 flex flex-wrap gap-6 text-sm text-gray-600">
                  {store.createdAt ? (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created{' '}
                      {typeof store.createdAt === 'string'
                        ? store.createdAt
                        : store.createdAt
                          ? new Date(store.createdAt).toLocaleString()
                          : '—'}
                    </span>
                  ) : null}
                  {store.updatedAt ? (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Updated{' '}
                      {typeof store.updatedAt === 'string'
                        ? store.updatedAt
                        : store.updatedAt
                          ? new Date(store.updatedAt).toLocaleString()
                          : '—'}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
