/**
 * Price shown to shoppers (catalog) — prefer VAT-inclusive fields from the product service.
 */

function num(x) {
  if (x == null || x === '') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/**
 * @returns {{ display: number, compareAt: number | null, includesVat: boolean, vatPct: number }}
 */
export function getCustomerFacingPriceParts(product) {
  if (!product || typeof product !== 'object') {
    return { display: 0, compareAt: null, includesVat: false, vatPct: 5 };
  }

  const vatPct = num(product.vat_percentage) ?? 5;
  const includesVat = Boolean(product.price_includes_vat);

  const priceWithVat = num(product.price_with_vat);
  const discountWithVat = num(product.discount_price_with_vat);
  const basePrice = num(product.price) ?? 0;
  const baseDiscount = num(product.discount_price);

  const addVat = (base) => {
    if (base == null || !Number.isFinite(base)) return 0;
    if (includesVat) return Math.round(base * 100) / 100;
    return Math.round(base * (1 + vatPct / 100) * 100) / 100;
  };

  if (
    discountWithVat != null &&
    discountWithVat > 0 &&
    priceWithVat != null &&
    priceWithVat > 0 &&
    discountWithVat < priceWithVat
  ) {
    return {
      display: discountWithVat,
      compareAt: priceWithVat,
      includesVat: true,
      vatPct,
    };
  }

  if (priceWithVat != null && priceWithVat > 0) {
    return { display: priceWithVat, compareAt: null, includesVat: true, vatPct };
  }

  const useDiscount =
    baseDiscount != null && baseDiscount > 0 && (basePrice <= 0 || baseDiscount < basePrice);
  const displayBase = useDiscount ? baseDiscount : basePrice;
  const compareBase = useDiscount && basePrice > 0 ? basePrice : null;

  return {
    display: addVat(displayBase),
    compareAt: compareBase != null ? addVat(compareBase) : null,
    includesVat,
    vatPct,
  };
}

export function formatMoney(amount, currencySymbol = '$') {
  const n = Number(amount) || 0;
  return `${currencySymbol}${n.toFixed(2)}`;
}
