/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Webpack configuration
  webpack: (config) => {
    // This is needed to make face-api.js work with Next.js
    config.resolve.fallback = { 
      fs: false, 
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      encoding: require.resolve('encoding'),
    };
    return config;
  },
  
  // Disable image optimization since we're using static export
  images: {
    unoptimized: true,
  },
  
  // Enable static export
  output: 'export',
  
  // Ensure trailing slashes for consistent URLs
  trailingSlash: true,
  
  // Experimental features
  experimental: {
    // Add any experimental features here if needed
  },
};

module.exports = nextConfig;


