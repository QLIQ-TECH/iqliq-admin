'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

function primaryImageUrl(product) {
  const images = product?.images;
  if (!Array.isArray(images) || images.length === 0) return '';
  const primary = images.find((img) => img?.is_primary && img?.url);
  return (primary || images[0])?.url || '';
}

function displayPrice(product) {
  const n =
    product?.discount_price_with_vat ??
    product?.price_with_vat ??
    product?.discount_price ??
    product?.price;
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `AED ${Number(n).toFixed(2)}`;
}

const Step5IqliqSalesSelectProduct = ({
  officialBrandId,
  selectedProductIds,
  setSelectedProductIds,
  closeCreateGigDrawer,
  setCurrentStep,
  progressBarClass = 'w-[58%]',
}) => {
  const [products, setProducts] = useState([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async () => {
    if (!officialBrandId?.trim()) {
      setFetchError('Missing brand id for catalog.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');

    try {
      const qs = new URLSearchParams({
        officialBrandId: officialBrandId.trim(),
        page: '1',
        limit: '10'
      });
      const url = `/api/catalog/vendor-brand?${qs.toString()}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`Products request failed (${res.status})`);
      }
      const json = await res.json();
      const list = json?.data?.products;
      const pagination = json?.data?.pagination;
      setProducts(Array.isArray(list) ? list : []);
      setTotalAvailable(
        typeof pagination?.total === 'number' ? pagination.total : Array.isArray(list) ? list.length : 0
      );
    } catch (e) {
      console.error('Vendor brand products fetch failed:', e);
      setFetchError(e?.message || 'Could not load products');
      setProducts([]);
      setTotalAvailable(0);
    } finally {
      setLoading(false);
    }
  }, [officialBrandId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p?.title || '').toLowerCase().includes(q));
  }, [products, search]);

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p._id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      const drop = new Set(filteredProducts.map((p) => p._id));
      setSelectedProductIds((prev) => prev.filter((id) => !drop.has(id)));
      return;
    }
    const addIds = filteredProducts.map((p) => p._id).filter(Boolean);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...addIds])));
  };

  const toggleProduct = (id) => {
    if (!id) return;
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedCount = selectedProductIds.length;
  const selectedLabel =
    selectedCount === 0
      ? '0 product selected'
      : selectedCount === 1
        ? '1 product selected'
        : `${selectedCount} products selected`;

  const canProceed = selectedCount > 0;

  return (
    <div className="w-full max-w-3xl mx-auto pt-4 h-full flex flex-col">
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-8">
        <div className={`h-full ${progressBarClass} bg-blue-500 rounded-full`} />
      </div>

      <h2 className="text-4xl font-semibold text-black mb-2">Step 4 : Select the product</h2>
      <p className="text-[16px] text-gray-600 leading-tight mb-8">
        Choose the product to promote. You&apos;ll fill in gig details and targets on the next step.
      </p>

      <div className="relative mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full h-[52px] rounded-full bg-[#f0f0f0] px-5 pr-14 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none border border-transparent focus:border-gray-200"
          type="search"
          autoComplete="off"
        />
        <Search
          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
          strokeWidth={2}
        />
      </div>

      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={handleSelectAll}
          className="flex items-center gap-3 text-left"
          disabled={filteredProducts.length === 0}
        >
          <span
            className={`h-5 w-5 rounded-full border-2 shrink-0 inline-flex items-center justify-center bg-white ${
              allFilteredSelected ? 'border-[#0082FF]' : 'border-gray-700'
            }`}
          >
            {allFilteredSelected ? <span className="h-2.5 w-2.5 rounded-full bg-[#0082FF]" /> : null}
          </span>
          <span className="text-[16px] font-semibold text-black">Select All</span>
        </button>
        <p className="text-[14px] text-gray-600">
          {selectedLabel} • {totalAvailable} products available
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 min-h-[200px]">
        {loading ? (
          <div className="text-[16px] text-gray-500 py-12 text-center">Loading products…</div>
        ) : fetchError ? (
          <div className="text-[16px] text-red-600 py-8 text-center">{fetchError}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-[16px] text-gray-500 py-12 text-center">No products match your search.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pb-2">
            {filteredProducts.map((product) => {
              const id = product._id;
              const selected = selectedProductIds.includes(id);
              const img = primaryImageUrl(product);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleProduct(id)}
                  className={`rounded-[12px] border bg-white overflow-hidden text-left transition-shadow transition-colors shadow-sm ${
                    selected
                      ? 'border-[#0082FF] shadow-md ring-1 ring-[#0082FF]/25'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="relative h-[200px] sm:h-[200px] w-full bg-[#ececec] overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
                    ) : null}
                    <span
                      className={`absolute top-1.5 right-1.5 h-[18px] w-[18px] rounded-full border-2 bg-white shadow-sm inline-flex items-center justify-center ${
                        selected ? 'border-[#0082FF]' : 'border-gray-500'
                      }`}
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-[#0082FF]" /> : null}
                    </span>
                  </div>
                  <div className="px-2.5 py-2 sm:px-3 sm:py-2.5">
                    <div className="text-[13px] sm:text-[14px] font-semibold text-black leading-snug line-clamp-2 min-h-[2.25rem]">
                      {product.title}
                    </div>
                    <div className="text-[14px] sm:text-[15px] font-semibold text-[#0082FF] mt-1 tracking-tight">
                      {displayPrice(product)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-5 mt-5 border-t border-gray-200 flex items-center justify-between shrink-0">
        <button
          type="button"
          className="px-6 h-[40px] rounded-full border border-[#0082FF] text-xl text-black bg-white"
          onClick={closeCreateGigDrawer}
        >
          Cancel
        </button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-8 h-[40px] rounded-full border border-[#0082FF] text-xl text-black bg-white"
            onClick={() => setCurrentStep(3)}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canProceed}
            className={`px-8 h-[40px] rounded-full text-xl ${
              canProceed
                ? 'bg-[#0082FF]/30 text-[#0082FF]'
                : 'bg-[#0082FF]/30 text-[#0082FF] cursor-not-allowed opacity-60'
            }`}
            onClick={() => setCurrentStep(5)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step5IqliqSalesSelectProduct;
