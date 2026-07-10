/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production builds
  swcMinify: true,
  
  // Reduce memory usage
  experimental: {
    // Optimize memory usage during builds
    workerThreads: false,
    cpus: 1,
  },
  
  // Image optimization
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Reduce bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    };
    
    return config;
  },
  
  // Disable source maps in production to reduce memory
  productionBrowserSourceMaps: false,
};

export default nextConfig;
