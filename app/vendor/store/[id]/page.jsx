'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import storeService from '../../../../lib/services/storeService';
import productService from '../../../../lib/services/productService';
import { ArrowLeft, Store, MapPin, Phone, Mail, Globe, Calendar, ExternalLink, Package } from 'lucide-react';

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

function extractProductsList(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.products)) return body.products;
  if (Array.isArray(body.data?.products)) return body.data.products;
  if (Array.isArray(body.data?.data)) return body.data.data;
  if (Array.isArray(body.data?.data?.products)) return body.data.data.products;
  return [];
}

/** Compare catalog owner field to JWT vendor id / user id (multiple shapes from auth). */
function ownsStore(ownerIdRaw, user) {
  if (ownerIdRaw == null || !user) return false;
  const normalizedOwner =
    typeof ownerIdRaw === 'object'
      ? ownerIdRaw?._id ?? ownerIdRaw?.id ?? ownerIdRaw
      : ownerIdRaw;
  const ownerStr =
    typeof normalizedOwner === 'object' && normalizedOwner?.toString
      ? normalizedOwner.toString()
      : String(normalizedOwner);
  const candidates = [user.vendorId, user.id, user._id]
    .filter((x) => x != null && x !== '')
    .map((x) => String(x));
  return candidates.some((c) => c === ownerStr);
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
  const [storeProducts, setStoreProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

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
      setStoreProducts([]);
      const raw = await storeService.getStoreById(storeId);
      const doc = extractStore(raw);
      if (!doc || typeof doc !== 'object') {
        setError('Store could not be loaded.');
        setStore(null);
        return;
      }

      const allowed = ownsStore(doc.ownerId, user);

      if (!allowed) {
        setError('You do not have access to this store.');
        setStore(null);
        return;
      }

      setStore(doc);

      const key = user?.vendorId ?? user?.id;
      if (key && doc._id) {
        try {
          setProductsLoading(true);
          const prodRes = await productService.getVendorStoreCatalog(String(doc._id), String(key));
          const list = extractProductsList(prodRes);
          setStoreProducts(list);
        } catch (pe) {
          console.error('Store products load failed:', pe);
          setStoreProducts([]);
        } finally {
          setProductsLoading(false);
        }
      }
    } catch (e) {
      console.error('Store detail load failed:', e);
      setError(e.message || 'Failed to load store.');
      setStore(null);
      setStoreProducts([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, user]);

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

              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  Products in this store
                </h2>
                <p className="text-xs text-gray-500">
                  Includes draft and pending approval — same catalog you manage under Products.
                </p>
                {productsLoading ? (
                  <p className="text-sm text-gray-500">Loading products…</p>
                ) : storeProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No products linked to this store yet. Add products from the vendor Products area.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {storeProducts.map((p) => {
                      const pid = p._id ?? p.id;
                      const img = Array.isArray(p.images) ? p.images[0] : null;
                      const thumb =
                        typeof img === 'string'
                          ? img
                          : img && typeof img === 'object'
                            ? img.url
                            : null;
                      return (
                        <li key={String(pid)} className="py-3 flex items-center gap-3 first:pt-0">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{p.title || 'Product'}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {[p.approval_status, p.status].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-gray-900">
                              {p.price != null && !Number.isNaN(Number(p.price))
                                ? Number(p.price).toFixed(2)
                                : '—'}
                            </p>
                            {pid ? (
                              <Link
                                href={`/vendor/products/edit/${pid}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Edit
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

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
