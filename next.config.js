/** @type {import('next').NextConfig} */
const nextConfig = {
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
      'upload.wikimedia.org',
      // AWS S3 domains
      'devqliqecommerce.s3.ap-south-1.amazonaws.com',
      'iqliq-mumbai.s3.ap-south-1.amazonaws.com',
      's3.ap-south-1.amazonaws.com',
      's3.amazonaws.com'
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
