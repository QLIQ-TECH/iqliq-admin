/**
 * Gigs Management Service
 * Calls backendgigs for gig assignments list (paginated).
 */

import { gigsApi } from '../apiClient';

const gigsService = {
  // Example:
  // GET /gig-assignments/gigs?status=&paymentStatus=&page=1&limit=10
  getGigAssignments: async (params = {}) => {
    return await gigsApi.get('/gig-assignments/gigs', params);
  },

  /** Brand's IQliqer / influencer partner assignments (list + aggregate counts). */
  getBrandPartnerAssignments: async (params = {}) => {
    return await gigsApi.get('/gig-assignments/brand-partners', params);
  },

  getCampaignStats: async (campaignId) => {
    return await gigsApi.get(`/campaigns/${campaignId}/stats`);
  },

  getCampaignGigs: async (campaignId, params = {}) => {
    return await gigsApi.get(`/campaigns/${campaignId}/gigs`, params);
  },

  /** Brand-scoped campaigns list (paginated). */
  getBrandCampaigns: async (params = {}) => {
    return await gigsApi.get('/campaigns/brand', params);
  },

  /** Brand campaign dashboard KPIs (spend, impressions, CTR, ROI, etc.). */
  getBrandCampaignOverviewStats: async () => {
    return await gigsApi.get('/campaigns/brand/overview-stats');
  },

  createCampaign: async (body) => {
    return await gigsApi.post('/campaigns/create', body);
  },

  /** Creators payment queue: pending assignments with unpaid completion (paginated). */
  getCreatorsPaymentQueue: async (params = {}) => {
    return await gigsApi.get('/gig-assignments/gigs', {
      status: 'Pending',
      paymentStatus: 'UnPaid',
      page: 1,
      limit: 10,
      ...params
    });
  },

  /** Accepted + unpaid: amounts owed before payout (paginated). */
  getCreatorsOwedQueue: async (params = {}) => {
    return await gigsApi.get('/gig-assignments/gigs', {
      status: 'Accepted',
      paymentStatus: 'UnPaid',
      page: 1,
      limit: 10,
      ...params
    });
  },

  /** Paid-out assignments (history), paginated. */
  getCreatorsPaymentHistory: async (params = {}) => {
    return await gigsApi.get('/gig-assignments/gigs', {
      status: 'Accepted',
      paymentStatus: 'Paid',
      page: 1,
      limit: 10,
      ...params
    });
  }
};

export default gigsService;

