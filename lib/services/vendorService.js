/**
 * Vendor Management Service
 * List views use ecommerce auth (ecom-master) — GET /api/auth/users?role=vendor.
 * Mutations, documents, orders, etc. still use the admin vendor API where applicable.
 */

import { authApi, vendorApi, productApi } from '../apiClient';

/** Map ecom-master / auth user row to the shape admin UI tables expect */
function mapAuthUserToVendorRow(u) {
  const rawId = u.id ?? u._id;
  const id = rawId != null ? String(rawId) : '';
  const verifiedFlag = Boolean(u.verified ?? u.isVerified);
  return {
    id,
    _id: id,
    name: u.name ?? '',
    email: u.email ?? '',
    phone: u.phone ?? '',
    businessName: u.businessName ?? u.storeName ?? u.companyName ?? '',
    role: u.role ?? 'vendor',
    status: u.status ?? 'inactive',
    verified: verifiedFlag,
    isVerified: verifiedFlag,
    commissionRate: u.commissionRate ?? null,
    createdAt: u.createdAt ?? null,
    lastLogin: u.lastLogin ?? null,
    cognitoUserId: u.cognitoUserId,
    externalServiceUserId: u.externalServiceUserId,
  };
}

function buildVendorStats(list) {
  return {
    total: list.length,
    active: list.filter((v) => v.status === 'active').length,
    pending: list.filter((v) => v.status === 'pending').length,
    suspended: list.filter((v) => v.status === 'suspended').length,
    verified: list.filter((v) => v.isVerified).length,
  };
}

/**
 * Load vendors from ecom-master via auth API (super_admin / admin token).
 */
async function fetchVendorsFromEcomMaster(params = {}) {
  const {
    status: statusParam,
    includeInactive,
    limit: limitParam,
    page: pageParam,
    search,
  } = params;

  let status = 'all';
  if (statusParam && statusParam !== 'all') {
    status = statusParam;
  } else if (includeInactive === false && !statusParam) {
    status = 'active';
  }

  const singlePageLimit =
    limitParam !== undefined && limitParam !== null && limitParam !== ''
      ? Number(limitParam)
      : null;

  const searchOpt = search ? { search: String(search) } : {};

  if (singlePageLimit != null && !Number.isNaN(singlePageLimit)) {
    const page = Number(pageParam) || 1;
    const res = await authApi.get('/users', {
      role: 'vendor',
      status,
      limit: Math.min(Math.max(singlePageLimit, 1), 5000),
      page,
      ...searchOpt,
    });
    const vendors = (res.users || []).map(mapAuthUserToVendorRow);
    return {
      success: true,
      data: vendors,
      pagination: res.pagination,
      stats: buildVendorStats(vendors),
    };
  }

  const pageSize = 500;
  let page = 1;
  const all = [];
  let lastPagination = null;

  while (true) {
    const res = await authApi.get('/users', {
      role: 'vendor',
      status,
      limit: pageSize,
      page,
      ...searchOpt,
    });
    lastPagination = res.pagination;
    const batch = res.users || [];
    all.push(...batch.map(mapAuthUserToVendorRow));
    if (!res.pagination?.hasNextPage || batch.length === 0) break;
    page += 1;
    if (page > 200) break;
  }

  return {
    success: true,
    data: all,
    pagination: lastPagination,
    stats: buildVendorStats(all),
  };
}

export const vendorService = {
  // Get all vendors (ecommerce / ecom-master auth DB)
  getAllVendors: async (params = {}) => {
    console.log('🔍 [VendorService] getAllVendors (ecom-master /auth/users) params:', params);
    try {
      const normalized = await fetchVendorsFromEcomMaster(params);
      console.log('✅ [VendorService] getAllVendors count:', normalized.data?.length);
      return normalized;
    } catch (error) {
      console.error('❌ [VendorService] getAllVendors error:', error);
      throw error;
    }
  },

  /** Pending vendor registrations (status=pending in auth User) */
  getPendingVendors: async (params = {}) => {
    return fetchVendorsFromEcomMaster({ ...params, status: 'pending' });
  },

  // Get vendor by ID
  getVendorById: async (vendorId) => {
    return await vendorApi.get(`/vendors/${vendorId}`);
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    return await vendorApi.post('/vendors', vendorData);
  },

  // Update vendor
  updateVendor: async (vendorId, vendorData) => {
    return await vendorApi.put(`/vendors/${vendorId}`, vendorData);
  },

  // Delete vendor
  deleteVendor: async (vendorId) => {
    return await vendorApi.delete(`/vendors/${vendorId}`);
  },

  // Update vendor status (approve/reject/suspend)
  updateVendorStatus: async (vendorId, status) => {
    return await vendorApi.put(`/vendors/${vendorId}/status`, { status });
  },

  // Suspend vendor
  suspendVendor: async (vendorId, reason) => {
    return await vendorApi.put(`/vendors/${vendorId}/suspend`, { reason });
  },

  // Activate vendor
  activateVendor: async (vendorId) => {
    return await vendorApi.put(`/vendors/${vendorId}/activate`);
  },

  // Verify vendor KYC on ecommerce auth (ecom-master): PUT .../api/auth/vendors/:id/verify
  verifyVendor: async (vendorId, verificationData) => {
    return await authApi.put(`/vendors/${vendorId}/verify`, verificationData);
  },

  // Get vendor documents
  getVendorDocuments: async (vendorId) => {
    return await vendorApi.get(`/vendors/${vendorId}/documents`);
  },

  // Upload vendor document
  uploadVendorDocument: async (vendorId, formData) => {
    return await vendorApi.upload(`/vendors/${vendorId}/documents`, formData);
  },

  // Get vendor performance metrics
  getVendorPerformance: async (vendorId) => {
    return await vendorApi.get(`/vendors/${vendorId}/performance`);
  },

  // Update vendor commission on ecom-master auth service
  updateVendorCommission: async (vendorId, commissionRate) => {
    return await authApi.put(`/vendors/${vendorId}/commission`, { commissionRate });
  },

  // Get vendor's products
  getVendorProducts: async (vendorId, params = {}) => {
    return await productApi.get(`/products`, { ...params, vendor_id: vendorId });
  },

  // Get vendor's orders
  getVendorOrders: async (vendorId, params = {}) => {
    return await vendorApi.get(`/vendors/${vendorId}/orders`, params);
  },

  // Get vendor revenue
  getVendorRevenue: async (vendorId, params = {}) => {
    return await vendorApi.get(`/vendors/${vendorId}/revenue`, params);
  },
};

export default vendorService;
