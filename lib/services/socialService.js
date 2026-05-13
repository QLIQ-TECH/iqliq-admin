/**
 * Social / followers — backendposts.
 */

import { postsApi } from '../apiClient';

const socialService = {
  getFollowers: async (params = {}) => {
    return await postsApi.get('/social/followers', params);
  }
};

export default socialService;
