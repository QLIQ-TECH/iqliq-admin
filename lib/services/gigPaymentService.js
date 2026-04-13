/**
 * Stripe gig payouts via backendpayment (vendor Owed flow).
 * POST /gig/multiple-payment — body is a JSON array of line items (see backend contract).
 * Response: { data: { checkoutUrl, payments } } — redirect browser to checkoutUrl.
 */

import { paymentApi } from '../apiClient';

/** Per assignment: base amount, 15% platform fee, 5% VAT (same as payment drawer). */
function computeLineTotals(row) {
  const gigC = Number(row?.gigId?.gigcompletionAmount ?? 0);
  const gigS = Number(row?.gigId?.gigSuccessAmount ?? 0);
  const amount = gigC + gigS;
  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const vat = Math.round(amount * 0.05 * 100) / 100;
  const totalAmount = Math.round((amount + platformFee + vat) * 100) / 100;
  return { amount, platformFee, vat, totalAmount };
}

/**
 * Build payload array for POST /gig/multiple-payment (exact shape expected by API).
 * @param {object[]} assignments — gig assignment rows from gigs API
 * @returns {object[]}
 */
export function buildGigMultiplePaymentPayload(assignments) {
  const list = Array.isArray(assignments) ? assignments : [];
  return list.map((a) => {
    const { amount, platformFee, vat, totalAmount } = computeLineTotals(a);
    const productName = String(a?.gigId?.title ?? 'Gig').trim() || 'Gig';
    const gigAssignmentId = String(a?._id ?? '');
    const gigId = String(a?.gigId?._id ?? a?.gigId?.id ?? '');
    const influencerId = a?.influencerId?._id
      ? String(a.influencerId._id)
      : '';

    return {
      productName,
      gigAssignmentId,
      gigId,
      influencerId,
      amount,
      vat,
      platformFee,
      totalAmount,
      afterDiscount: totalAmount.toFixed(2),
      payment: 'gigCompletionAmount_gigSuccessAmount',
      cash: totalAmount,
      qoyn: 0
    };
  });
}

function extractCheckoutUrl(res) {
  if (!res || typeof res !== 'object') return null;
  const inner = res.data;
  if (inner && typeof inner === 'object' && typeof inner.checkoutUrl === 'string') {
    return inner.checkoutUrl;
  }
  return typeof res.checkoutUrl === 'string' ? res.checkoutUrl : null;
}

/**
 * POST body must be the array itself: [{ productName, gigAssignmentId, ... }, ...]
 */
export async function createGigMultiplePaymentSession(assignments) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new Error('No gig assignments to pay.');
  }

  const payload = buildGigMultiplePaymentPayload(assignments);

  return await paymentApi.post('/gig/multiple-payment', payload);
}

/**
 * Redirect to Stripe hosted page using URL from API (not redirectToCheckout sessionId).
 */
export function redirectToGigPaymentCheckout(apiResponse) {
  if (apiResponse && apiResponse.success === false) {
    throw new Error(
      typeof apiResponse.message === 'string'
        ? apiResponse.message
        : 'Checkout could not be created.'
    );
  }
  const url = extractCheckoutUrl(apiResponse);
  if (!url) {
    const msg =
      typeof apiResponse?.message === 'string'
        ? apiResponse.message
        : 'Missing checkout URL in payment response.';
    throw new Error(msg);
  }
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

export { extractCheckoutUrl };
