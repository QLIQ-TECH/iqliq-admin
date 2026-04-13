/**
 * Store Management Service
 * Handles all store-related API calls
 */

import { productApi } from '../apiClient';

export const storeService = {
  // Get all stores
  getAllStores: async (params = {}) => {
    return await productApi.get('/stores', params);
  },

  // Get store by ID
  getStoreById: async (storeId) => {
    return await productApi.get(`/stores/${storeId}`);
  },

  // Create new store
  createStore: async (storeData) => {
    return await productApi.post('/stores', storeData);
  },

  // Update store
  updateStore: async (storeId, storeData) => {
    return await productApi.put(`/stores/${storeId}`, storeData);
  },

  // Delete store
  deleteStore: async (storeId) => {
    return await productApi.delete(`/stores/${storeId}`);
  },

  // Get stores by vendor
  getStoresByVendor: async (vendorId, clearCache = false) => {
    console.log('🔍 Fetching stores for vendor:', vendorId);

    // Use the general endpoint first because it is vendor-safe.
    // Hitting a restricted endpoint first can trigger a 401 and force logout.
    const params = { ownerId: vendorId };
    if (clearCache) {
      params.clearCache = 'true';
    }

    try {
      const response = await productApi.get('/stores', params);
      console.log('🔍 Store service response (general endpoint):', response);
      return response;
    } catch (error) {
      console.log('🔍 General stores endpoint failed, trying owner endpoint:', error.message);

      // Avoid fallback on auth failures because ApiClient already handles 401 globally.
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('401') || message.includes('unauthorized')) {
        throw error;
      }

      try {
        const response = await productApi.get(`/stores/owner/${vendorId}`);
        console.log('🔍 Store service response (owner endpoint):', response);
        return response;
      } catch (fallbackError) {
        console.error('🔍 Both store endpoints failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Upload store logo
  uploadStoreLogo: async (storeId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return await productApi.upload(`/stores/${storeId}/upload-logo`, formData);
  },
};

export default storeService;

