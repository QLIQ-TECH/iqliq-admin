/** @type {import('next').NextConfig} */
const rawVendorOnboardingUrl =
  process.env.NEXT_PUBLIC_VENDOR_ONBOARDING_URL || 'https://vendor.iqliq.ae/onboarding';
const normalizedVendorOnboardingUrl = rawVendorOnboardingUrl.replace(/\/$/, '');
const vendorOnboardingBaseUrl = normalizedVendorOnboardingUrl.endsWith('/onboarding')
  ? normalizedVendorOnboardingUrl
  : `${normalizedVendorOnboardingUrl}/onboarding`;
const vendorOnboardingOriginUrl = vendorOnboardingBaseUrl.endsWith('/onboarding')
  ? vendorOnboardingBaseUrl.slice(0, -'/onboarding'.length)
  : vendorOnboardingBaseUrl;

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/onboarding/assets/:path*',
        destination: `${vendorOnboardingOriginUrl}/assets/:path*`,
      },
      {
        source: '/onboarding',
        destination: vendorOnboardingBaseUrl,
      },
      {
        source: '/onboarding/:path*',
        destination: `${vendorOnboardingBaseUrl}/:path*`,
      },
    ];
  },
  // App directory is now stable in Next.js 14, no need for experimental flag
  images: {
    domains: [
      'api.builder.io',
      'example.com',
      'backendcatalog.qliq.ae',
      'backendauth.qliq.ae',
      'adminapi.qliq.ae',
      'search.qliq.ae',
      'backendcart.qliq.ae',
      'backendreview.qliq.ae',
      'ecommerce-dev.qliq.ae',
      'dev-admin.qliq.ae',
      'images.unsplash.com',
      'source.unsplash.com',
      'picsum.photos',
      'image.shutterstock.com',
      'via.placeholder.com',
      'placehold.co',
      'dummyimage.com',
      'logo.clearbit.com',
      'upload.wikimedia.org'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow unoptimized images (for external sources)
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
}

module.exports = nextConfig
