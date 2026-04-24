import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies GET /api/catalog/vendor-brand → catalog service /products/vendor-brand
 * so the admin UI can load vendor-brand products without browser CORS issues.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const officialBrandId = searchParams.get('officialBrandId');
  if (!officialBrandId?.trim()) {
    return NextResponse.json(
      { success: false, message: 'officialBrandId is required' },
      { status: 400 }
    );
  }

  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '10';
  const catalogBase =
    process.env.NEXT_PUBLIC_PRODUCT_API_URL || 'https://backendcatalog.qliq.ae/api';
  const upstream = new URL(
    `${catalogBase.replace(/\/$/, '')}/products/vendor-brand`
  );
  upstream.searchParams.set('officialBrandId', officialBrandId.trim());
  upstream.searchParams.set('page', page);
  upstream.searchParams.set('limit', limit);

  const res = await fetch(upstream.toString(), { cache: 'no-store' });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json; charset=utf-8'
    }
  });
}
