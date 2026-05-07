/**
 * Brand / user wallet (Qoyns) — backendwallet.
 */

import { walletApi } from '../apiClient';

const walletService = {
  getUserWalletInfo: async (params = {}) => {
    return await walletApi.get('/wallet/user/info', params);
  }
};

export default walletService;
