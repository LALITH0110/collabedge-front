/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/:path*`, // Use environment variable
        // This ensures that all API calls go to the backend, even if there's a matching API route
        has: [
          {
            type: 'header',
            key: 'x-skip-next-api-route',
            value: '(?<skip>.*)',
          },
        ],
      },
      // This is a catch-all route that forwards all API requests to the backend
      // if they don't match an existing API route
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/:path*`, // Use environment variable
      },
    ]
  },
}

export default nextConfig
