/**
 * Helpers for vendor order lists (admin panel ↔ cart order API).
 */

export function normalizeOrderStatus(order) {
  return String(order?.status ?? '').toLowerCase().trim() || 'unknown';
}

/**
 * Order is still in the vendor's "to fulfill" queue (payment often complete, not yet shipped).
 * Matches common post-checkout statuses on Order model.
 */
export function isVendorFulfillmentPendingStatus(status) {
  const s = String(status ?? '').toLowerCase().trim();
  return s === 'pending' || s === 'accepted' || s === 'processing';
}

export function extractOrdersListFromApiResponse(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.orders)) return response.orders;
  if (response.data?.orders && Array.isArray(response.data.orders)) return response.data.orders;
  return [];
}
