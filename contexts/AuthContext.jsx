'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../lib/api-debug';
import { authApi, REFRESH_TOKEN_KEY } from '../lib/apiClient';
import { loginApi, signUpApi } from '../src/api/services/auth.api';

const AuthContext = createContext();
const ACCESS_TOKEN_KEY = 'qliq-admin-access-token';
const USER_KEY = 'qliq-admin-user';
const LEGACY_TOKENS_KEY = 'qliq-admin-tokens';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  const withTimeout = (promise, timeoutMs) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };

  const clearVendorOnboardingKeys = () => {
    if (typeof window === 'undefined') return;
    const keysToRemove = [
      'access_token',
      'refresh_token',
      'email',
      'id',
      'role',
      LEGACY_TOKENS_KEY,
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  useEffect(() => {
    let isMounted = true;
    // Safety net: never allow auth bootstrap to keep the app in loading forever.
    const loadingGuard = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ Auth init timeout reached, forcing isLoading=false');
        setIsLoading(false);
      }
    }, 8000);

    const initAuth = async () => {
      // Small delay to ensure localStorage is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem(USER_KEY);
        let savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (!savedToken) {
          const legacyTokensRaw = localStorage.getItem(LEGACY_TOKENS_KEY);
          if (legacyTokensRaw) {
            try {
              const legacyTokens = JSON.parse(legacyTokensRaw);
              if (legacyTokens?.accessToken) {
                savedToken = legacyTokens.accessToken;
                localStorage.setItem(ACCESS_TOKEN_KEY, legacyTokens.accessToken);
              }
              if (legacyTokens?.refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, legacyTokens.refreshToken);
              }
            } catch {
              localStorage.removeItem(LEGACY_TOKENS_KEY);
            }
          }
        }
        
        console.log('🔄 Restoring session from localStorage:', {
          hasUser: !!savedUser,
          hasToken: !!savedToken
        });
        
        if (savedUser && savedToken) {
          try {
            const userData = JSON.parse(savedUser);
            
            console.log('✅ Session restored successfully:', userData.email);
            setUser(userData);
            setTokens({
              accessToken: savedToken,
              refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || null,
            });
            if (isMounted) setIsLoading(false);
            
            // Optionally verify token in background (don't wait for it)
            // Only clear session if explicitly unauthorized
            verifyToken(savedToken).catch((err) => {
              console.log('Background token verification failed:', err);
            });
          } catch (error) {
            console.error('❌ Error parsing saved auth data:', error);
            clearAuthData();
            if (isMounted) setIsLoading(false);
          }
        } else {
          const vendorAccess = localStorage.getItem('access_token');
          const vendorRefresh = localStorage.getItem('refresh_token');
          if (vendorAccess) {
            try {
              localStorage.setItem(ACCESS_TOKEN_KEY, vendorAccess);
              if (vendorRefresh) {
                localStorage.setItem(REFRESH_TOKEN_KEY, vendorRefresh);
              }
              await verifyToken(vendorAccess);
              if (isMounted) setIsLoading(false);
            } catch (e) {
              console.error('Vendor token adoption failed:', e);
              if (isMounted) setIsLoading(false);
            }
          } else {
            console.log('❌ No saved session found');
            if (isMounted) setIsLoading(false);
          }
        }
      } else {
        if (isMounted) setIsLoading(false);
      }
    };
    
    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(loadingGuard);
    };
  }, []);

  const verifyToken = async (accessToken) => {
    try {
      if (typeof window !== 'undefined' && accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      }

      const response = await withTimeout(authApi.get('/profile'), 4000);
      const userData = response.user || response.data || response;
      
      if (!userData || !userData.email) {
        throw new Error('Invalid user data received from profile endpoint');
      }
      
      // Map backend roles to frontend roles
      let frontendRole = 'vendor'; // default
      if (userData.role === 'admin' || userData.role === 'manager' || userData.role === 'super_admin') {
        frontendRole = 'superadmin';
      }
      
      const normalizedUserId = userData.id || userData._id;
      const onboardingCompletedLocal =
        typeof window !== 'undefined' && localStorage.getItem('onboarding_completed') === 'true';
      const frontendUserData = {
        id: normalizedUserId,
        email: userData.email,
        name: userData.name,
        role: frontendRole,
        avatar: userData.name.charAt(0).toUpperCase(),
        phone: userData.phone,
        cognitoUserId: userData.cognitoUserId,
        vendorId: userData.vendorId || normalizedUserId, // Add vendorId field
        onboardingCompleted: userData.onboardingCompleted ?? onboardingCompletedLocal ?? (userData.vendorId ? true : false),
      };
      
      setUser(frontendUserData);
      setTokens({
        accessToken: accessToken || (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null),
        refreshToken: typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(frontendUserData));
        if (typeof frontendUserData.onboardingCompleted === 'boolean') {
          localStorage.setItem('onboarding_completed', String(frontendUserData.onboardingCompleted));
          if (frontendUserData.onboardingCompleted === true) {
            clearVendorOnboardingKeys();
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't clear auth data immediately - user might just have saved the session
      // Only clear if it's a 401/403 (unauthorized) error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.log('Token is invalid, clearing auth data');
        clearAuthData();
      } else {
        // Network or other error - keep the user logged in
        console.log('Verification failed but keeping session (network issue)');
      }
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('qliq-admin-tokens');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('onboarding_completed');
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await loginApi({
        email,
        password,
        roles: ['vendor', 'brand', 'admin', 'manager', 'super_admin'],
      });

      // Support multiple response shapes from different auth deployments:
      // { user, tokens } OR { data: { user, tokens } } OR { data: { data: { user, tokens } } }
      const payload =
        (res?.user && res) ||
        (res?.data?.user && res.data) ||
        (res?.data?.data?.user && res.data.data) ||
        res;

      const userData = payload?.user || payload?.data?.user || null;
      const tokenData = payload?.tokens || payload?.data?.tokens || null;
      const accessToken =
        tokenData?.accessToken || tokenData?.access_token || payload?.accessToken || null;
      const refreshToken =
        tokenData?.refreshToken || tokenData?.refresh_token || payload?.refreshToken || null;

      if (!userData || !accessToken) {
        console.error('Unexpected login response shape:', res);
        throw new Error('Login failed: tokens missing from response');
      }

      let frontendRole = 'vendor';
      if (
        userData.role === 'admin' ||
        userData.role === 'manager' ||
        userData.role === 'super_admin'
      ) {
        frontendRole = 'superadmin';
      }

      const normalizedUserId = userData.id || userData._id || '';
      const onboardingCompleted =
        typeof userData.onboardingCompleted === 'boolean'
          ? userData.onboardingCompleted
          : userData.vendorId ? true : false; // If vendor has vendorId, consider onboarding complete

      const frontendUserData = {
        id: normalizedUserId,
        email: userData.email,
        name: userData.name || '',
        role: frontendRole,
        avatar: (userData.name || 'U').charAt(0).toUpperCase(),
        phone: userData.phone || '',
        cognitoUserId: userData.cognitoUserId || '',
        vendorId: userData.vendorId || normalizedUserId,
        onboardingCompleted,
      };

      setUser(frontendUserData);
      setTokens({ accessToken, refreshToken: refreshToken || null });

      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(frontendUserData));
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(
          LEGACY_TOKENS_KEY,
          JSON.stringify({ accessToken, refreshToken: refreshToken || null })
        );
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }

        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        } else {
          localStorage.removeItem('refresh_token');
        }
        if (userData.email) localStorage.setItem('email', userData.email);
        if (normalizedUserId) localStorage.setItem('id', normalizedUserId);
        if (userData.role) localStorage.setItem('role', userData.role);
        localStorage.setItem('onboarding_completed', String(onboardingCompleted));
      }

      return { success: true, user: frontendUserData };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData) => {
    try {
      setIsLoading(true);
      const res = await signUpApi(signupData);

      // Support multiple response shapes
      const payload =
        (res?.user && res) ||
        (res?.data?.user && res.data) ||
        (res?.data?.data?.user && res.data.data) ||
        res;

      const userData = payload?.user || payload?.data?.user || null;
      const tokenData = payload?.tokens || payload?.data?.tokens || null;
      const accessToken =
        tokenData?.accessToken || tokenData?.access_token || payload?.accessToken || null;
      const refreshToken =
        tokenData?.refreshToken || tokenData?.refresh_token || payload?.refreshToken || null;

      if (!userData || !accessToken) {
        console.error('Unexpected signup response shape:', res);
        throw new Error('Signup failed: tokens missing from response');
      }

      // Map roles
      let frontendRole = 'vendor';
      if (
        userData.role === 'admin' ||
        userData.role === 'manager' ||
        userData.role === 'super_admin'
      ) {
        frontendRole = 'superadmin';
      }

      const normalizedUserId = userData.id || userData._id || '';
      const onboardingCompleted =
        typeof userData.onboardingCompleted === 'boolean'
          ? userData.onboardingCompleted
          : userData.vendorId ? true : false;

      const frontendUserData = {
        id: normalizedUserId,
        email: userData.email,
        name: userData.name || '',
        role: frontendRole,
        avatar: (userData.name || 'U').charAt(0).toUpperCase(),
        phone: userData.phone || '',
        cognitoUserId: userData.cognitoUserId || '',
        vendorId: userData.vendorId || normalizedUserId,
        onboardingCompleted,
      };

      setUser(frontendUserData);
      setTokens({ accessToken, refreshToken: refreshToken || null });

      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(frontendUserData));
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(
          LEGACY_TOKENS_KEY,
          JSON.stringify({ accessToken, refreshToken: refreshToken || null })
        );
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }

        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        } else {
          localStorage.removeItem('refresh_token');
        }
        if (userData.email) localStorage.setItem('email', userData.email);
        if (normalizedUserId) localStorage.setItem('id', normalizedUserId);
        if (userData.role) localStorage.setItem('role', userData.role);
        localStorage.setItem('onboarding_completed', String(onboardingCompleted));
      }

      return { success: true, user: frontendUserData };
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if needed
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local data regardless of API call result
      clearAuthData();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshAccessToken = async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.refreshToken(refreshToken);
    const newAccessToken = response?.tokens?.accessToken;
    if (!newAccessToken) {
      throw new Error('No access token returned from refresh');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      try {
        const legacyRaw = localStorage.getItem('qliq-admin-tokens');
        const legacy = legacyRaw ? JSON.parse(legacyRaw) : {};
        localStorage.setItem(
          'qliq-admin-tokens',
          JSON.stringify({ ...legacy, accessToken: newAccessToken })
        );
      } catch {
        localStorage.setItem('qliq-admin-tokens', JSON.stringify({ accessToken: newAccessToken, refreshToken }));
      }
    }

    setTokens((prev) => ({ ...(prev || {}), accessToken: newAccessToken, refreshToken }));
    return newAccessToken;
  };

  const value = {
    user,
    tokens,
    login,
    signup,
    logout,
    refreshAccessToken,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
