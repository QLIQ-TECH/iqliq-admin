import type { Influencer } from '@/types/brand';
import { http } from '../client';
import type { Category, Language, OnboardingPayload } from '@/types/onboarding';
import type { GetStoresResponse, Store, VendorApiResponse } from '@/lib/types';


type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    influencers: Influencer[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
};

export const getInfluencers = async (search?: string, page: number = 1, limit: number = 10) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  return http.get<ApiResponse>("posts", `/api/social/influencers-followers-count?${params.toString()}`);
};

export const getLanguages = async () => {
  return http.get<{ data: Language[] }>('onboarding', '/api/languages');
};

export const getCategories = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  return http.get<{ data: Category[] }>('onboarding', `/api/vendor-product-category?${params.toString()}`);
};

export const getCompetitors = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return http.get<VendorApiResponse>('onboarding', `/api/vendors${suffix}`);
};

export const postOnboarding = async (data: OnboardingPayload) => {
  return http.post('onboarding', '/api/vendors/onboarding', data);
};

export const getStores = async (): Promise<Store[]> => {
  const response = await http.get<GetStoresResponse>(
    'onboarding',
    '/api/stores?type=online'
  );
  return response.data || [];
};
