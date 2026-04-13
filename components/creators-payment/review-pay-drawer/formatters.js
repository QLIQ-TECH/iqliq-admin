export function formatUsd(value) {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

export function computePaymentTotals(assignments) {
  const list = Array.isArray(assignments) ? assignments : [];
  let subtotal = 0;
  let gigSum = 0;
  let successSum = 0;
  for (const row of list) {
    const g = Number(row?.gigId?.gigcompletionAmount ?? 0);
    const s = Number(row?.gigId?.gigSuccessAmount ?? 0);
    gigSum += g;
    successSum += s;
    subtotal += g + s;
  }
  const platformFee = Math.round(subtotal * 0.15 * 100) / 100;
  const vat = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + platformFee + vat) * 100) / 100;
  return {
    transactionCount: list.length,
    subtotal,
    gigSum,
    successSum,
    platformFee,
    vat,
    total
  };
}
