/**
 * Product Management Service
 * Handles all product-related API calls
 */

import { productApi, adminApi } from '../apiClient';
import s3Service from './s3Service';

const getMediaUploadBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:5005';
  const normalized = raw.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const productService = {
  // Get all products (use product API directly for approval status filtering)
  getAllProducts: async (params = {}) => {
    return await productApi.get('/products', params);
  },

  /** Vendor dashboard: all products for a store (any approval status) when store belongs to vendor. */
  getVendorStoreCatalog: async (storeId, vendorId, params = {}) => {
    if (!storeId || !vendorId) {
      return { success: true, data: [] };
    }
    return await productApi.get('/products', {
      store_id: storeId,
      vendor_id: vendorId,
      approval_status: 'all',
      page: 1,
      limit: 200,
      ...params,
    });
  },

  // Get product by ID
  getProductById: async (productId) => {
    return await productApi.get(`/products/${productId}`);
  },

  // Create new product
  createProduct: async (productData) => {
    return await productApi.post('/products', productData);
  },

  // Update product
  updateProduct: async (productId, productData) => {
    return await productApi.put(`/products/${productId}`, productData);
  },

  // Delete product
  deleteProduct: async (productId) => {
    return await productApi.delete(`/products/${productId}`);
  },

  // Get pending products
  getPendingProducts: async () => {
    return await productApi.get('/products', { approval_status: 'pending' });
  },

  // Approve product
  approveProduct: async (productId) => {
    return await productApi.put(`/products/${productId}/approve`);
  },

  // Reject product
  rejectProduct: async (productId, reason) => {
    return await productApi.put(`/products/${productId}/reject`, { reason });
  },

  // Bulk approve products
  bulkApproveProducts: async (productIds) => {
    return await productApi.post('/products/bulk-approve', { productIds });
  },

  // Bulk reject products
  bulkRejectProducts: async (productIds, reason) => {
    return await productApi.post('/products/bulk-reject', { productIds, reason });
  },

  // Bulk upload products
  bulkUploadProducts: async (products) => {
    return await productApi.post('/products/bulk-upload', { products });
  },


  // Get pending vendors summary (count per vendor)
  getPendingVendorsSummary: async (params = {}) => {
    return await productApi.get('/products/pending/vendors', params);
  },

  // Get pending products by vendor
  getVendorPendingProducts: async (vendorId, params = {}) => {
    const query = { approval_status: 'pending', vendor_id: vendorId, ...params };
    return await productApi.get('/products', query);
  },

  // Get product categories
  getCategories: async (params = {}) => {
    return await productApi.get('/categories', params);
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    return await productApi.get(`/categories/${categoryId}`);
  },

  // Create category
  createCategory: async (categoryData) => {
    return await productApi.post('/categories', categoryData);
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    return await productApi.put(`/categories/${categoryId}`, categoryData);
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    return await productApi.delete(`/categories/${categoryId}`);
  },

  // Upload category icon
  uploadCategoryIcon: async (categoryId, file) => {
    const formData = new FormData();
    formData.append('icon', file);
    return await productApi.upload(`/categories/${categoryId}/upload-icon`, formData);
  },

  // Upload product images directly to S3
  uploadProductImages: async (files, token) => {
    try {
      // Use S3 service for direct upload
      const result = await s3Service.uploadProductImages(files);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload images to S3');
      }

      return {
        success: result.success,
        message: result.message,
        data: result.data.map((item) => ({
          url: item.url,
          key: item.key,
          originalName: item.originalName,
          size: item.size,
          type: item.type
        }))
      };
    } catch (error) {
      console.error('Product image upload error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload images',
        data: []
      };
    }
  },

  // Legacy method for backward compatibility (now uses S3)
  uploadProductImagesLegacy: async (files, token) => {
    const formData = new FormData();
    
    // Handle both single file and multiple files
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append('images', file);
      });
    } else {
      formData.append('images', files);
    }
    
    formData.append('folder', 'products');
    formData.append('optimize', 'true');
    formData.append('maxWidth', '1200');
    formData.append('maxHeight', '1200');
    formData.append('quality', '85');

    // Upload directly from frontend to media service and keep returned URLs
    const authToken = token || localStorage.getItem('qliq-admin-access-token') || '';
    const mediaApiUrl = getMediaUploadBaseUrl();
    const response = await fetch(`${mediaApiUrl}/upload/product-images`, {
      method: 'POST',
      body: formData,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload images');
    }

    const payload = await response.json();
    const data = Array.isArray(payload?.data) ? payload.data : [];

    return {
      success: Boolean(payload?.success),
      message: payload?.message,
      data: data.map((item) => ({
        url: item?.url || item?.location || '',
        key: item?.key || '',
      })).filter((item) => item.url),
    };
  },

  // Get brands
  getBrands: async (params = {}) => {
    // Add clearCache=true to bypass cache issues
    const paramsWithCacheClear = { ...params, clearCache: 'true' };
    return await productApi.get('/brands', paramsWithCacheClear);
  },

  // Create brand
  createBrand: async (brandData) => {
    return await productApi.post('/brands', brandData);
  },

  // Update brand
  updateBrand: async (brandId, brandData) => {
    return await productApi.put(`/brands/${brandId}`, brandData);
  },

  // Delete brand
  deleteBrand: async (brandId) => {
    return await productApi.delete(`/brands/${brandId}`);
  },

  // Get product attributes
  getAttributes: async () => {
    return await productApi.get('/attributes');
  },

  // Create attribute
  createAttribute: async (attributeData) => {
    return await productApi.post('/attributes', attributeData);
  },

  // Amazon-style related categories and attributes
  getRelatedCategories: async (categoryId) => {
    return await productApi.get(`/attributes/related-categories/${categoryId}`);
  },

  getAttributesByMultipleCategories: async (categoryIds) => {
    return await productApi.post('/attributes/by-categories', { categoryIds });
  },
};

export default productService;

