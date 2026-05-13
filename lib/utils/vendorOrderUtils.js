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
  // "other" may be used for interim/system states before shipped
  return (
    s === 'pending' ||
    s === 'processing' ||
    s === 'other'
  );
}

/** Align cart API orders with customer names and totals (same as vendor orders list page). */
export function normalizeVendorOrder(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const vendorItemsTotal = items.reduce(
    (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
    0
  );
  const status = normalizeOrderStatus(order);
  return {
    ...order,
    status,
    orderNumber: order?.orderNumber || order?._id?.slice?.(-8),
    totalAmount: Number(order?.totalAmount ?? order?.total ?? vendorItemsTotal ?? 0),
    customer:
      order?.customer || {
        name: order?.shippingAddress?.fullName || order?.userId?.name || 'N/A',
        email: order?.shippingAddress?.email || order?.userId?.email || 'N/A',
      },
  };
}

export function extractOrdersListFromApiResponse(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.orders)) return response.orders;
  if (response.data?.orders && Array.isArray(response.data.orders)) return response.data.orders;
  // Some gateways wrap payload twice
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
}
