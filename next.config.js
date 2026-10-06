const packageJson = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ]
  },
  reactStrictMode: true,
  distDir: process.env.BUILD_DIR || '.next',
  images: {
    remotePatterns: [
      {
        hostname: "https://console.firebase.google.com/",
      },
    ],
    domains: ['firebasestorage.googleapis.com'],
    // path: `assets/slider/*`,
  },
}

module.exports = nextConfig

