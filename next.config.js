/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['via.placeholder.com', 'devapi.vidyaai.co', 'api.vidyaai.co'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
  },
  // // Proxy API requests to backend in development
  // async rewrites() {
  //   const isLocal = process.env.NEXT_PUBLIC_NODE_ENV === 'local' || process.env.NODE_ENV === 'local';
    
  //   if (isLocal) {
  //     return [
  //       {
  //         source: '/api/:path*',
  //         destination: 'http://127.0.0.1:8000/api/:path*',
  //       },
  //     ];
  //   }
  //   return [];
  // },
  // Enable CORS for API routes if needed
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Webpack configuration for handling imports
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
