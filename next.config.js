/** @type {import('next').NextConfig} */
const vendorOnboardingUrl = process.env.NEXT_PUBLIC_VENDOR_ONBOARDING_URL || 'https://vendor.iqliq.ae';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/onboarding',
        destination: vendorOnboardingUrl,
      },
      {
        source: '/onboarding/:path*',
        destination: `${vendorOnboardingUrl}/:path*`,
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
