/**
 * Centralized API Client for All Microservices
 * Handles authentication, error handling, and request/response interceptors
 */

import Cookies from 'js-cookie';
const ACCESS_TOKEN_KEY = 'qliq-admin-access-token';

// Microservice Base URLs
// Note: AUTH_API_URL may include /auth suffix, so we normalize it for base URL
const getAuthBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081/api/auth';
  // Remove /auth suffix if present to get base URL
  return url.replace(/\/api\/auth$/, '/api');
};

const API_BASE_URLS = {
  AUTH: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081/api/auth',
  AUTH_BASE: getAuthBaseUrl(), // Base URL without /auth for metrics endpoints
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009/api',
  PRODUCT: process.env.NEXT_PUBLIC_PRODUCT_API_URL || 'http://localhost:8082/api',
  CART: process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api',
  REVIEW: process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8083/api',
  SEARCH: process.env.NEXT_PUBLIC_SEARCH_API_URL || 'http://localhost:8081/api',
  MEDIA: process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:5005/api',
  // Consolidated in qliq-admin-api (port 8009)
  VENDOR: process.env.NEXT_PUBLIC_VENDOR_API_URL || 'http://localhost:8009/api',
  COMMISSION: process.env.NEXT_PUBLIC_COMMISSION_API_URL || 'http://localhost:8009/api',
  CUSTOMER: process.env.NEXT_PUBLIC_CUSTOMER_API_URL || 'http://localhost:8009/api',
  PROMOTION: process.env.NEXT_PUBLIC_PROMOTION_API_URL || 'http://localhost:8009/api',
  REPORT: process.env.NEXT_PUBLIC_REPORT_API_URL || 'http://localhost:8009/api',
  METRICS: process.env.NEXT_PUBLIC_METRICS_API_URL || 'http://localhost:8009/api',
  // Future services if needed
  SHIPPING: process.env.NEXT_PUBLIC_SHIPPING_API_URL || 'http://localhost:8009/api',
  CMS: process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:8009/api',
  NOTIFICATION: process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:8009/api',
  CONFIG: process.env.NEXT_PUBLIC_CONFIG_API_URL || 'http://localhost:8009/api',
  SUPPORT: process.env.NEXT_PUBLIC_SUPPORT_API_URL || 'http://localhost:8009/api',
  USERS: process.env.NEXT_PUBLIC_USERS_API_URL || 'https://backendusers.qliq.ae/api',
  GIGS: process.env.NEXT_PUBLIC_GIGS_API_URL || 'https://backendgigs.qliq.ae/api',
  PAYMENT: process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://backendpayment.qliq.ae/api',
};

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Get auth token from localStorage (matching AuthContext storage)
  getAuthToken() {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      console.log('🔍 [ApiClient] getAuthToken - parsed tokens:', {
        hasAccessToken: true,
        accessTokenLength: token.length
      });
      return token;
    }

    console.log('❌ [ApiClient] No tokens found in localStorage');
    return null;
  }

  // Get default headers
  getHeaders(customHeaders = {}) {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...customHeaders,
    };
  }

  // Handle API response
  async handleResponse(response, originalRequest = null) {
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        // Unauthorized - clear auth data and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('qliq-admin-user');
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          Cookies.remove('authToken');
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const requestInfo = { method: 'GET', url, body: null };
    const headers = this.getHeaders();
    
    console.log('🔍 [ApiClient] GET request:', {
      url,
      headers: headers,
      params
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });
    
    console.log('📊 [ApiClient] GET response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
    
    return this.handleResponse(response, requestInfo);
  }


  // POST request
  async post(endpoint, body = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestInfo = { method: 'POST', url, body };

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    return this.handleResponse(response, requestInfo);
  }

  // PUT request
  async put(endpoint, body = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestInfo = { method: 'PUT', url, body };
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    return this.handleResponse(response, requestInfo);
  }


  // DELETE request
  async delete(endpoint, body = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestInfo = { method: 'DELETE', url, body };

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
      ...(Object.keys(body).length && { body: JSON.stringify(body) }),
    });
    
    return this.handleResponse(response, requestInfo);
  }

  // Upload file (multipart/form-data)
  async upload(endpoint, formData) {
    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include',
      body: formData,
    });
    
    return this.handleResponse(response);
  }
}

// Create API client instances for each microservice
export const authApi = new ApiClient(API_BASE_URLS.AUTH);
export const adminApi = new ApiClient(API_BASE_URLS.ADMIN);
export const productApi = new ApiClient(API_BASE_URLS.PRODUCT);
export const cartApi = new ApiClient(API_BASE_URLS.CART);
export const reviewApi = new ApiClient(API_BASE_URLS.REVIEW);
export const searchApi = new ApiClient(API_BASE_URLS.SEARCH);
export const mediaApi = new ApiClient(API_BASE_URLS.MEDIA);
export const vendorApi = new ApiClient(API_BASE_URLS.VENDOR);
export const commissionApi = new ApiClient(API_BASE_URLS.COMMISSION);
export const customerApi = new ApiClient(API_BASE_URLS.CUSTOMER);
export const promotionApi = new ApiClient(API_BASE_URLS.PROMOTION);
export const shippingApi = new ApiClient(API_BASE_URLS.SHIPPING);
export const cmsApi = new ApiClient(API_BASE_URLS.CMS);
export const notificationApi = new ApiClient(API_BASE_URLS.NOTIFICATION);
export const reportApi = new ApiClient(API_BASE_URLS.REPORT);
export const metricsApi = new ApiClient(API_BASE_URLS.METRICS);
export const configApi = new ApiClient(API_BASE_URLS.CONFIG);
export const supportApi = new ApiClient(API_BASE_URLS.SUPPORT);
export const usersApi = new ApiClient(API_BASE_URLS.USERS);
export const gigsApi = new ApiClient(API_BASE_URLS.GIGS);
export const paymentApi = new ApiClient(API_BASE_URLS.PAYMENT);

export default ApiClient;

