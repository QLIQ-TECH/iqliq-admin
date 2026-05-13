'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { productService } from '../../../../lib/services/productService';

export default function PendingByVendorPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', approval_status: '' });

  const getVendorDisplayName = (product) => {
    if (!product) return 'N/A';
    const looksLikeObjectId = (value) =>
      typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value.trim());
    if (typeof product.vendorName === 'string' && product.vendorName.trim() && !looksLikeObjectId(product.vendorName)) return product.vendorName;
    if (typeof product.vendor_name === 'string' && product.vendor_name.trim()) return product.vendor_name;
    if (product.vendor_id && typeof product.vendor_id === 'object') {
      if (typeof product.vendor_id.name === 'string' && product.vendor_id.name.trim()) return product.vendor_id.name;
      if (typeof product.vendor_id.businessName === 'string' && product.vendor_id.businessName.trim()) return product.vendor_id.businessName;
    }
    if (product.vendor && typeof product.vendor === 'object') {
      if (typeof product.vendor.name === 'string' && product.vendor.name.trim()) return product.vendor.name;
      if (typeof product.vendor.businessName === 'string' && product.vendor.businessName.trim()) return product.vendor.businessName;
    }
    const productVendorId = normalizeId(product.vendor_id) || normalizeId(product.vendorId) || normalizeId(product.vendor);
    if (productVendorId) {
      const vendorSummary = vendors.find((v) => normalizeId(v.vendor_id) === productVendorId);
      const fallbackName = vendorSummary?.stores?.[0]?.name;
      if (typeof fallbackName === 'string' && fallbackName.trim()) return fallbackName;
    }
    return 'N/A';
  };

  const getPrimaryImageUrl = (images) => {
    if (!Array.isArray(images) || images.length === 0) return '';
    const primary = images.find((img) => img?.is_primary) || images[0];
    if (typeof primary === 'string') return primary;
    if (!primary || typeof primary !== 'object') return '';
    return primary.url || primary.image || primary.src || primary.location || '';
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (typeof value._id === 'string') return value._id;
      if (typeof value.id === 'string') return value.id;
      if (typeof value.$oid === 'string') return value.$oid;
      if (typeof value.toString === 'function') {
        const str = value.toString();
        if (str && str !== '[object Object]') return str;
      }
    }
    return null;
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await productService.getPendingVendorsSummary({ limit: 50 });
      if (res.success) {
        setVendors(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorProducts = async (vendorId) => {
    const normalizedVendorId = normalizeId(vendorId);
    if (!normalizedVendorId) return;

    setSelectedVendor(normalizedVendorId);
    setProducts([]);
    try {
      const res = await productService.getVendorPendingProducts(normalizedVendorId, { limit: 50 });
      if (res.success) {
        // approval_status routes can return either array or wrapped object
        const list = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res?.data?.products) ? res.data.products : (res.products || []));
        setProducts(Array.isArray(list) ? list : []);
      }
    } catch (e) {}
  };

  const handleApprove = async (productId) => {
    const normalizedProductId = normalizeId(productId);
    if (!normalizedProductId) {
      alert('Invalid product id');
      return;
    }
    try {
      setActionLoadingId(normalizedProductId);
      await productService.approveProduct(normalizedProductId);
      if (selectedVendor) {
        await fetchVendorProducts(selectedVendor);
      }
      await fetchVendors();
      closeProductDetails();
    } catch (error) {
      alert(error?.message || 'Failed to approve product');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (productId) => {
    const normalizedProductId = normalizeId(productId);
    if (!normalizedProductId) {
      alert('Invalid product id');
      return;
    }
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setActionLoadingId(normalizedProductId);
      await productService.rejectProduct(normalizedProductId, reason);
      if (selectedVendor) {
        await fetchVendorProducts(selectedVendor);
      }
      await fetchVendors();
      closeProductDetails();
    } catch (error) {
      alert(error?.message || 'Failed to reject product');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openProductDetails = async (productId) => {
    const normalizedProductId = normalizeId(productId);
    if (!normalizedProductId) {
      alert('Invalid product id');
      return;
    }
    try {
      setDetailsLoading(true);
      setIsDetailsOpen(true);
      const res = await productService.getProductById(normalizedProductId);
      const product = res?.data || res?.product || null;
      setSelectedProduct(product);
      setStatusForm({
        status: product?.status || 'draft',
        approval_status: product?.approval_status || 'pending',
      });
    } catch (error) {
      alert(error?.message || 'Failed to load product details');
      setIsDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeProductDetails = () => {
    setIsDetailsOpen(false);
    setSelectedProduct(null);
    setStatusForm({ status: '', approval_status: '' });
  };

  const handleUpdateProductStatuses = async () => {
    const normalizedProductId = normalizeId(selectedProduct?._id);
    if (!normalizedProductId) return;
    try {
      setActionLoadingId(normalizedProductId);

      const initialStatus = selectedProduct?.status || 'draft';
      const initialApproval = selectedProduct?.approval_status || 'pending';
      const statusChanged = initialStatus !== statusForm.status;
      const approvalChanged = initialApproval !== statusForm.approval_status;

      if (!statusChanged && !approvalChanged) {
        return;
      }

      if (approvalChanged) {
        if (statusForm.approval_status === 'approved') {
          await productService.approveProduct(normalizedProductId);
        } else if (statusForm.approval_status === 'rejected') {
          const reason = prompt('Enter rejection reason:');
          if (!reason) {
            return;
          }
          await productService.rejectProduct(normalizedProductId, reason);
        } else {
          await productService.updateProduct(normalizedProductId, {
            approval_status: statusForm.approval_status,
          });
        }
      }

      if (statusChanged) {
        await productService.updateProduct(normalizedProductId, {
          status: statusForm.status,
        });
      }

      if (selectedVendor) await fetchVendorProducts(selectedVendor);
      await fetchVendors();
      const shouldCloseAfterDecision =
        statusForm.approval_status === 'approved' || statusForm.approval_status === 'rejected';
      if (shouldCloseAfterDecision) {
        closeProductDetails();
      } else {
        await openProductDetails(normalizedProductId);
      }
    } catch (error) {
      alert(error?.message || 'Failed to update product status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const hasStatusChanges = Boolean(
    selectedProduct &&
      (
        (selectedProduct?.status || 'draft') !== statusForm.status ||
        (selectedProduct?.approval_status || 'pending') !== statusForm.approval_status
      )
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
        userType="superadmin"
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="superadmin"
          user={user}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Pending Approval by Vendor</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Vendors</h2>
              <ul className="divide-y">
                {vendors.map((v) => (
                  <li key={normalizeId(v.vendor_id) || v.stores?.[0]?.name} className={`py-2 flex items-center justify-between ${selectedVendor === normalizeId(v.vendor_id) ? 'bg-blue-50 rounded px-2' : ''}`}>
                    <div>
                      <div className="text-sm font-medium">{v.stores?.[0]?.name || 'Vendor'}</div>
                      <div className="text-xs text-gray-500">Pending products: {v.count}</div>
                    </div>
                    <button className="text-blue-600 text-sm" onClick={() => fetchVendorProducts(v.vendor_id)}>
                      View
                    </button>
                  </li>
                ))}
                {vendors.length === 0 && (
                  <li className="py-4 text-sm text-gray-500">No pending products</li>
                )}
              </ul>
            </div>

            <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Products</h2>
              {products.length === 0 ? (
                <div className="text-sm text-gray-500">Select a vendor to view products</div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={normalizeId(p._id) || p.title} className="border rounded p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        {p.images?.[0]?.url && (
                          <img src={p.images[0].url} alt={p.title} className="h-12 w-12 rounded object-cover mr-3" />
                        )}
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Store: {p.store_id?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Brand: {p.brand_id?.name || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>${p.price?.toFixed?.(2) || p.price}</div>
                        <div className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded inline-block mt-1">{p.approval_status}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openProductDetails(normalizeId(p._id))}
                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            View Product
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(normalizeId(p._id))}
                            disabled={actionLoadingId === normalizeId(p._id)}
                            className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoadingId === normalizeId(p._id) ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(normalizeId(p._id))}
                            disabled={actionLoadingId === normalizeId(p._id)}
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isDetailsOpen && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                  <button onClick={closeProductDetails} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>

                {detailsLoading || !selectedProduct ? (
                  <div className="p-6 text-sm text-gray-500">Loading product details...</div>
                ) : (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        {getPrimaryImageUrl(selectedProduct.images) ? (
                          <img
                            src={getPrimaryImageUrl(selectedProduct.images)}
                            alt={selectedProduct.title}
                            className="w-full h-56 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-56 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-500">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="text-xl font-semibold text-gray-900">{selectedProduct.title}</h4>
                        <p className="text-sm text-gray-600">{selectedProduct.short_description || selectedProduct.description || '-'}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">SKU:</span> {selectedProduct.sku || '-'}</div>
                          <div><span className="text-gray-500">Price:</span> ${selectedProduct.price}</div>
                          <div><span className="text-gray-500">Stock:</span> {selectedProduct.stock_quantity ?? 0}</div>
                      <div><span className="text-gray-500">Brand:</span> {selectedProduct.brand_id?.name || '-'}</div>
                      <div><span className="text-gray-500">Store:</span> {selectedProduct.store_id?.name || '-'}</div>
                      <div><span className="text-gray-500">Vendor:</span> {getVendorDisplayName(selectedProduct)}</div>
                    </div>
                  </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lifecycle Status</label>
                        <select
                          value={statusForm.status}
                          onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="draft">draft</option>
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="out_of_stock">out_of_stock</option>
                          <option value="discontinued">discontinued</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                        <select
                          value={statusForm.approval_status}
                          onChange={(e) => setStatusForm((prev) => ({ ...prev, approval_status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUpdateProductStatuses}
                        disabled={
                          actionLoadingId === normalizeId(selectedProduct._id) ||
                          !hasStatusChanges
                        }
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoadingId === normalizeId(selectedProduct._id) ? 'Updating...' : 'Update Statuses'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(normalizeId(selectedProduct._id))}
                        disabled={actionLoadingId === normalizeId(selectedProduct._id)}
                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(normalizeId(selectedProduct._id))}
                        disabled={actionLoadingId === normalizeId(selectedProduct._id)}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


